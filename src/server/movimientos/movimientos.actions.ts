"use server"

import { eq, inArray, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db/client"
import { counters, movementLines, movements, products } from "@/db/schema"
import { type Movimiento, movimientoSchema } from "@/schemas/movimientos.schema"
import { getUsuarioActual, requirePermiso } from "@/server/auth/auth.queries"
import { recalcularStockScoped } from "@/server/inventario/inventario.recalc"
import type { ActionResult } from "@/types/action.types"
import type { Direccion } from "@/types/movimientos.types"
import {
  direccionDeTipo,
  formatNumeroMovimiento,
  prefijoDeTipo,
} from "@/utils/movimientos.utils"

// Revalida las rutas que dependen de stock/movimientos (incluye las columnas de
// stock diferidas en los maestros Productos y Bodegas).
const revalidar = () => {
  revalidatePath("/movimientos")
  revalidatePath("/stock")
  revalidatePath("/productos")
  revalidatePath("/bodegas")
}

// Mapea el input validado + campos derivados a columnas de `movements`
// (strings vacíos → null, igual que el patrón de Productos).
const aColumnasMovimiento = (
  data: Movimiento,
  extra: { numero: string; direccion: Direccion; usuario: string },
) => ({
  numero: extra.numero,
  direccion: extra.direccion,
  tipoMovimiento: data.tipoMovimiento,
  fecha: new Date(data.fecha),
  bodegaId: data.bodegaId,
  bodegaDestinoId: data.bodegaDestinoId || null,
  documento: data.documento || null,
  tipoDoc: data.tipoDoc || null,
  numeroDoc: data.numeroDoc || null,
  proveedorCodigo: data.proveedorCodigo || null,
  clienteCodigo: data.clienteCodigo || null,
  centroCosto: data.centroCosto || null,
  observaciones: data.observaciones || null,
  usuario: extra.usuario,
  autorizadoPor: data.autorizadoPor || null,
})

export const crearMovimiento = async (
  input: unknown,
): Promise<ActionResult> => {
  await requirePermiso("movimientos.crear")
  const parsed = movimientoSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }
  const data = parsed.data

  const usuario = await getUsuarioActual()
  if (!usuario) return { ok: false, error: "Sesión no válida" }

  const direccion = direccionDeTipo(data.tipoMovimiento)
  const prefijo = prefijoDeTipo(data.tipoMovimiento)
  if (!prefijo) return { ok: false, error: "Tipo de movimiento inválido" }

  const codigos = [...new Set(data.lineas.map((l) => l.codigoInterno))]

  await db.transaction(async (tx) => {
    // Correlativo atómico por prefijo, sin huecos (mismo patrón que Productos).
    const [counter] = await tx
      .insert(counters)
      .values({ clave: prefijo.toUpperCase(), valor: 1 })
      .onConflictDoUpdate({
        target: counters.clave,
        set: { valor: sql`${counters.valor} + 1` },
      })
      .returning({ valor: counters.valor })
    const numero = formatNumeroMovimiento(prefijo, counter.valor)

    // Atributos de los productos de las líneas (decide si se persiste lote/venc).
    const prods = await tx
      .select({
        codigoInterno: products.codigoInterno,
        manejaAtributos: products.manejaAtributos,
      })
      .from(products)
      .where(inArray(products.codigoInterno, codigos))
    const manejaPorCodigo = new Map(
      prods.map((p) => [p.codigoInterno, p.manejaAtributos]),
    )

    await tx
      .insert(movements)
      .values(aColumnasMovimiento(data, { numero, direccion, usuario: usuario.nombre }))

    await tx.insert(movementLines).values(
      data.lineas.map((l) => {
        const maneja = manejaPorCodigo.get(l.codigoInterno) ?? false
        return {
          movementNumero: numero,
          codigoInterno: l.codigoInterno,
          descripcion: l.descripcion || null,
          unidadMedida: l.unidadMedida || null,
          cantidad: String(l.cantidad),
          costo: String(l.costo),
          lote: maneja && l.lote ? l.lote : null,
          fechaVenc: maneja && l.fechaVenc ? l.fechaVenc : null,
          loteId: null,
        }
      }),
    )

    // Recálculo PPP acotado a los productos afectados. El motor hace floor a 0 en
    // salidas y origen de traspaso: el stock negativo se permite (paridad con el
    // monolito) — intencional, no se valida ni bloquea.
    await recalcularStockScoped(tx, codigos)
  })

  revalidar()
  return { ok: true }
}

export const anularMovimiento = async (
  numero: string,
): Promise<ActionResult> => {
  await requirePermiso("movimientos.anular")

  const mov = await db.query.movements.findFirst({
    where: eq(movements.numero, numero),
  })
  if (!mov) return { ok: false, error: "Movimiento no encontrado" }
  if (mov.anulado) return { ok: false, error: "El movimiento ya está anulado" }

  await db.transaction(async (tx) => {
    await tx
      .update(movements)
      .set({ anulado: true, updatedAt: new Date() })
      .where(eq(movements.numero, numero))

    const lineas = await tx
      .select({ codigoInterno: movementLines.codigoInterno })
      .from(movementLines)
      .where(eq(movementLines.movementNumero, numero))
    const codigos = [...new Set(lineas.map((l) => l.codigoInterno))]

    // El motor filtra los anulados, así el movimiento sale de la reproducción y
    // el stock/lots de esos códigos se corrige solo.
    await recalcularStockScoped(tx, codigos)
  })

  revalidar()
  return { ok: true }
}
