"use server"

import { and, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db/client"
import { counters, inventoryCountLines, inventoryCounts } from "@/db/schema"
import { construirExcel } from "@/lib/xlsx"
import {
  ESTADO_APLICADA,
  ESTADO_DEVUELTA,
  ESTADO_PENDIENTE,
  ESTADO_RECHAZADA,
  ESTADOS_EDITABLES,
  PREFIJO_TOMA,
  TIPO_TOMA_ENT,
  TIPO_TOMA_SAL,
} from "@/constants/tomas.constants"
import {
  capturarTomaSchema,
  iniciarTomaSchema,
  motivoTomaSchema,
} from "@/schemas/tomas.schema"
import { registrarAuditoria } from "@/server/audit/audit.core"
import { getUsuarioActual, requirePermiso } from "@/server/auth/auth.queries"
import { insertarMovimiento } from "@/server/inventario/inventario.core"
import { recalcularStockScoped } from "@/server/inventario/inventario.recalc"
import {
  getStockParaToma,
  getToma,
  getTomaEnCursoDeUsuario,
  getTomas,
} from "@/server/tomas/tomas.queries"
import type { ActionResult } from "@/types/action.types"
import type { ExportResult } from "@/types/export.types"
import { formatNumeroMovimiento } from "@/utils/movimientos.utils"
import { calcularAjustes } from "@/utils/tomas.utils"

type IniciarResult = { ok: true; id: string } | { ok: false; error: string }

const revalidar = (id?: string) => {
  revalidatePath("/tomas")
  if (id) revalidatePath(`/tomas/${id}`)
}

const revalidarStock = () => {
  revalidatePath("/stock")
  revalidatePath("/movimientos")
  revalidatePath("/productos")
  revalidatePath("/bodegas")
}

// Inicia una toma: arma el snapshot teórico (stock+lotes) y lo persiste como
// líneas. Guard: un solo conteo abierto (EN_PROCESO/DEVUELTA) por operador.
export const iniciarToma = async (input: unknown): Promise<IniciarResult> => {
  await requirePermiso("tomas.crear")
  const parsed = iniciarTomaSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }
  const data = parsed.data

  const usuario = await getUsuarioActual()
  if (!usuario) return { ok: false, error: "Sesión no válida" }

  const enCurso = await getTomaEnCursoDeUsuario(usuario.id)
  if (enCurso)
    return {
      ok: false,
      error: `Ya tienes una toma en curso (${enCurso}). Termínala antes de iniciar otra.`,
    }

  const lineas = await getStockParaToma(data.bodegaId, {
    grupo: data.filtroGrupo,
    tipo: data.filtroTipo,
    alcance: data.alcance,
  })
  if (lineas.length === 0)
    return { ok: false, error: "No hay productos para inventariar con ese filtro" }

  const id = `toma_${crypto.randomUUID()}`
  let numeroToma = ""

  try {
    await db.transaction(async (tx) => {
      const [counter] = await tx
        .insert(counters)
        .values({ clave: PREFIJO_TOMA, valor: 1 })
        .onConflictDoUpdate({
          target: counters.clave,
          set: { valor: sql`${counters.valor} + 1` },
        })
        .returning({ valor: counters.valor })
      const numero = formatNumeroMovimiento(PREFIJO_TOMA, counter.valor)
      numeroToma = numero

      await tx.insert(inventoryCounts).values({
        id,
        numero,
        bodegaId: data.bodegaId,
        estado: "EN_PROCESO",
        alcance: data.alcance,
        filtroGrupo: data.filtroGrupo || null,
        filtroTipo: data.filtroTipo || null,
        observaciones: data.observaciones || null,
        usuario: usuario.id,
      })

      await tx.insert(inventoryCountLines).values(
        lineas.map((l) => ({
          countId: id,
          codigoInterno: l.codigoInterno,
          descripcion: l.descripcion || null,
          unidadMedida: l.unidadMedida || null,
          manejaAtributos: l.manejaAtributos,
          loteId: l.loteId,
          lote: l.lote,
          fechaVenc: l.fechaVenc,
          teorico: String(l.teorico),
          costoTeorico: String(l.costoTeorico),
        })),
      )
    })
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo iniciar la toma",
    }
  }

  await registrarAuditoria({
    usuario: usuario.id,
    accion: "toma.iniciar",
    detalle: `Toma iniciada en bodega ${data.bodegaId}`,
    referencia: numeroToma,
  })
  revalidar(id)
  return { ok: true, id }
}

// Carga la toma y valida que el usuario sea el dueño y el estado editable.
const cargarEditable = async (countId: string) => {
  const usuario = await getUsuarioActual()
  if (!usuario) return { ok: false as const, error: "Sesión no válida" }
  const toma = await getToma(countId)
  if (!toma) return { ok: false as const, error: "Toma no encontrada" }
  if (toma.usuario !== usuario.id)
    return {
      ok: false as const,
      error: "Solo el operador de la toma puede editarla",
    }
  if (!ESTADOS_EDITABLES.includes(toma.estado))
    return { ok: false as const, error: "La toma no está en un estado editable" }
  return { ok: true as const, usuario, toma }
}

// Persiste los conteos físicos de las líneas (sin cerrar). Capturar borra la marca
// de "asumido cero": solo el cierre la vuelve a poner sobre lo no contado.
const persistirConteos = async (
  countId: string,
  lineas: { id: number; fisico: number | null; fisicoIngresado: boolean }[],
) => {
  await db.transaction(async (tx) => {
    for (const l of lineas) {
      await tx
        .update(inventoryCountLines)
        .set({
          fisico: l.fisicoIngresado && l.fisico !== null ? String(l.fisico) : null,
          fisicoIngresado: l.fisicoIngresado,
          asumidoCero: false,
        })
        .where(
          and(
            eq(inventoryCountLines.id, l.id),
            eq(inventoryCountLines.countId, countId),
          ),
        )
    }
  })
}

export const guardarConteo = async (input: unknown): Promise<ActionResult> => {
  await requirePermiso("tomas.crear")
  const parsed = capturarTomaSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }

  const ctx = await cargarEditable(parsed.data.countId)
  if (!ctx.ok) return ctx

  await persistirConteos(parsed.data.countId, parsed.data.lineas)
  revalidar(parsed.data.countId)
  return { ok: true }
}

// Cierra la toma para autorización: persiste los conteos y asume en 0 lo no
// contado (asumidoCero). Estado → PENDIENTE_AUTORIZACION.
export const cerrarToma = async (input: unknown): Promise<ActionResult> => {
  await requirePermiso("tomas.crear")
  const parsed = capturarTomaSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }

  const ctx = await cargarEditable(parsed.data.countId)
  if (!ctx.ok) return ctx
  const { usuario } = ctx
  const countId = parsed.data.countId

  await persistirConteos(countId, parsed.data.lineas)

  await db.transaction(async (tx) => {
    // Pendientes (sin conteo) → físico 0, marcadas como asumido cero.
    await tx
      .update(inventoryCountLines)
      .set({ fisico: "0", fisicoIngresado: true, asumidoCero: true })
      .where(
        and(
          eq(inventoryCountLines.countId, countId),
          eq(inventoryCountLines.fisicoIngresado, false),
        ),
      )

    await tx
      .update(inventoryCounts)
      .set({
        estado: ESTADO_PENDIENTE,
        cerradoAt: new Date(),
        cerradoPor: usuario.id,
      })
      .where(eq(inventoryCounts.id, countId))
  })

  await registrarAuditoria({
    usuario: usuario.id,
    accion: "toma.cerrar",
    detalle: `Toma ${ctx.toma.numero} cerrada para autorización`,
    referencia: ctx.toma.numero,
  })
  revalidar(countId)
  return { ok: true }
}

// Autoriza y aplica los ajustes: genera un TIE consolidado por sobrantes y un TIS
// por faltantes (costo = costoTeorico congelado), recalcula stock una sola vez y
// cierra la toma como APLICADA con los números de movimiento generados.
export const autorizarToma = async (countId: string): Promise<ActionResult> => {
  await requirePermiso("tomas.autorizar")
  const usuario = await getUsuarioActual()
  if (!usuario) return { ok: false, error: "Sesión no válida" }

  const toma = await getToma(countId)
  if (!toma) return { ok: false, error: "Toma no encontrada" }
  if (toma.estado !== ESTADO_PENDIENTE)
    return { ok: false, error: "La toma no está pendiente de autorización" }

  const { sobrantes, faltantes } = calcularAjustes(toma.lineas)
  const ahora = new Date()
  const autor = `Toma ${toma.numero} · autorizado por ${usuario.id}`

  try {
    await db.transaction(async (tx) => {
      const generados: string[] = []
      const codigos = new Set<string>()

      if (sobrantes.length > 0) {
        const numero = await insertarMovimiento(tx, {
          tipoMovimiento: TIPO_TOMA_ENT,
          fecha: ahora,
          bodegaId: toma.bodegaId,
          documento: `Toma ${toma.numero}`,
          observaciones: `Sobrantes detectados en toma ${toma.numero}. ${autor}.`,
          usuario: usuario.nombre,
          autorizadoPor: usuario.id,
          tomaId: toma.id,
          tomaNumero: toma.numero,
          lineas: sobrantes,
        })
        generados.push(numero)
        for (const l of sobrantes) codigos.add(l.codigoInterno)
      }

      if (faltantes.length > 0) {
        const numero = await insertarMovimiento(tx, {
          tipoMovimiento: TIPO_TOMA_SAL,
          fecha: ahora,
          bodegaId: toma.bodegaId,
          documento: `Toma ${toma.numero}`,
          observaciones: `Faltantes detectados en toma ${toma.numero}. ${autor}.`,
          usuario: usuario.nombre,
          autorizadoPor: usuario.id,
          tomaId: toma.id,
          tomaNumero: toma.numero,
          lineas: faltantes,
        })
        generados.push(numero)
        for (const l of faltantes) codigos.add(l.codigoInterno)
      }

      await recalcularStockScoped(tx, [...codigos])

      await tx
        .update(inventoryCounts)
        .set({
          estado: ESTADO_APLICADA,
          autorizadoPor: usuario.id,
          autorizadoAt: ahora,
          aplicadoAt: ahora,
          movimientosGenerados: generados,
        })
        .where(eq(inventoryCounts.id, countId))
    })
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudieron aplicar los ajustes",
    }
  }

  await registrarAuditoria({
    usuario: usuario.id,
    accion: "toma.autorizar",
    detalle: `Toma ${toma.numero} autorizada y aplicada`,
    referencia: toma.numero,
  })
  revalidar(countId)
  revalidarStock()
  return { ok: true }
}

// Devuelve la toma al operador (vuelve a editable). Limpia las marcas de asumido
// cero para permitir recontar.
export const devolverToma = async (input: unknown): Promise<ActionResult> => {
  await requirePermiso("tomas.autorizar")
  const parsed = motivoTomaSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const usuario = await getUsuarioActual()
  if (!usuario) return { ok: false, error: "Sesión no válida" }

  const toma = await getToma(parsed.data.countId)
  if (!toma) return { ok: false, error: "Toma no encontrada" }
  if (toma.estado !== ESTADO_PENDIENTE)
    return { ok: false, error: "Solo se puede devolver una toma pendiente" }

  await db.transaction(async (tx) => {
    await tx
      .update(inventoryCountLines)
      .set({ fisico: null, fisicoIngresado: false, asumidoCero: false })
      .where(
        and(
          eq(inventoryCountLines.countId, parsed.data.countId),
          eq(inventoryCountLines.asumidoCero, true),
        ),
      )
    await tx
      .update(inventoryCounts)
      .set({
        estado: ESTADO_DEVUELTA,
        devolucionMotivo: parsed.data.motivo,
        devolucionAt: new Date(),
        devolucionPor: usuario.id,
      })
      .where(eq(inventoryCounts.id, parsed.data.countId))
  })

  await registrarAuditoria({
    usuario: usuario.id,
    accion: "toma.devolver",
    detalle: `Devuelta al operador. Motivo: ${parsed.data.motivo}`,
    referencia: toma.numero,
  })
  revalidar(parsed.data.countId)
  return { ok: true }
}

// Rechaza la toma: la archiva sin aplicar ningún ajuste.
export const rechazarToma = async (input: unknown): Promise<ActionResult> => {
  await requirePermiso("tomas.autorizar")
  const parsed = motivoTomaSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const usuario = await getUsuarioActual()
  if (!usuario) return { ok: false, error: "Sesión no válida" }

  const toma = await getToma(parsed.data.countId)
  if (!toma) return { ok: false, error: "Toma no encontrada" }
  if (toma.estado !== ESTADO_PENDIENTE)
    return { ok: false, error: "Solo se puede rechazar una toma pendiente" }

  await db
    .update(inventoryCounts)
    .set({
      estado: ESTADO_RECHAZADA,
      rechazoMotivo: parsed.data.motivo,
      rechazoAt: new Date(),
      rechazoPor: usuario.id,
    })
    .where(eq(inventoryCounts.id, parsed.data.countId))

  await registrarAuditoria({
    usuario: usuario.id,
    accion: "toma.rechazar",
    detalle: `Rechazada sin aplicar. Motivo: ${parsed.data.motivo}`,
    referencia: toma.numero,
  })
  revalidar(parsed.data.countId)
  return { ok: true }
}

// Exporta el listado de tomas de inventario a Excel (generado en el servidor).
export const exportarTomasExcel = async (): Promise<ExportResult> => {
  await requirePermiso("tomas.ver")
  const tomas = await getTomas()
  const base64 = await construirExcel([
    {
      nombre: "Tomas de inventario",
      columnas: [
        { header: "N°", key: "numero", width: 16 },
        { header: "Bodega", key: "bodega", width: 24 },
        { header: "Estado", key: "estado", width: 22 },
        { header: "Alcance", key: "alcance", width: 14 },
        { header: "Usuario", key: "usuario", width: 18 },
        { header: "Líneas", key: "totalLineas", width: 10 },
        { header: "Conteadas", key: "conteadas", width: 12 },
        { header: "Con diferencia", key: "conDiferencia", width: 14 },
        { header: "Creada", key: "creadoAt", width: 20 },
      ],
      filas: tomas,
    },
  ])
  return { ok: true, base64, filename: "tomas.xlsx" }
}
