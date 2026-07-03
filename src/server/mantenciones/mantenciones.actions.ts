"use server"

import { asc, eq } from "drizzle-orm"
import ExcelJS from "exceljs"
import { revalidatePath } from "next/cache"
import {
  ESTADO_ABIERTA,
  ESTADO_FACTURADA,
  MANT_UNIDAD_PRODUCTO,
  MANT_WAREHOUSE_ID,
  TIPO_MOVIMIENTO_SERVICIO,
} from "@/constants/mantenciones.constants"
import { db } from "@/db/client"
import {
  maintenanceOrderLines,
  maintenanceOrders,
  movementLines,
  movements,
} from "@/db/schema"
import {
  facturaSchema,
  type LineaOt,
  ordenTrabajoSchema,
  otIdSchema,
} from "@/schemas/mantenciones.schema"
import { getUsuarioActual, requirePermiso } from "@/server/auth/auth.queries"
import { insertarMovimiento } from "@/server/inventario/inventario.core"
import { recalcularStockScoped } from "@/server/inventario/inventario.recalc"
import {
  ensureBodegaServicios,
  ensureProductoServicio,
  siguienteNumeroOT,
} from "@/server/mantenciones/mantenciones.core"
import { getMantenciones } from "@/server/mantenciones/mantenciones.queries"
import type { ActionResult } from "@/types/action.types"
import {
  calcularTotalOT,
  construirObservacionFactura,
  descripcionMovimientoFactura,
  narrowFactura,
} from "@/utils/mantenciones.utils"

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

type ExportResult =
  | { ok: true; base64: string; filename: string }
  | { ok: false; error: string }

const RUTA = "/mantenciones"

const revalidar = () => {
  revalidatePath(RUTA)
}

// Facturar/revertir toca stock/movimientos: revalidar también esas rutas y las
// columnas de stock diferidas en los maestros (mismo criterio que Movimientos).
const revalidarConStock = () => {
  revalidatePath(RUTA)
  revalidatePath("/movimientos")
  revalidatePath("/stock")
  revalidatePath("/productos")
  revalidatePath("/bodegas")
}

// Solo se persisten las líneas con contenido (paridad monolito: guardarOT filtra
// las líneas sin producto/detalle/valor).
const lineasConContenido = (lineas: LineaOt[]): LineaOt[] =>
  lineas.filter((l) => Boolean(l.productoCodigo) || Boolean(l.detalle) || l.valorUnit > 0)

const aLineaColumnas = (orderId: string, l: LineaOt) => ({
  orderId,
  tipo: l.tipo,
  productoCodigo: l.productoCodigo || null,
  productoNombre: l.productoNombre || null,
  detalle: l.detalle || null,
  cantidad: String(l.cantidad),
  valorUnit: String(l.valorUnit),
})

// Revierte el movimiento SCI de una factura: borra el movimiento (cascade líneas)
// y recalcula el PPP de los productos afectados. Vínculo por numero de movimiento.
const revertirMovimiento = async (tx: Tx, numero: string): Promise<void> => {
  const lineas = await tx
    .select({ codigoInterno: movementLines.codigoInterno })
    .from(movementLines)
    .where(eq(movementLines.movementNumero, numero))
  const codigos = [...new Set(lineas.map((l) => l.codigoInterno))]
  await tx.delete(movements).where(eq(movements.numero, numero))
  await recalcularStockScoped(tx, codigos)
}

// Crea una OT (estado Abierta, correlativo OT-*). No toca inventario.
export const crearOrden = async (input: unknown): Promise<ActionResult> => {
  await requirePermiso("mantenciones.crear")
  const parsed = ordenTrabajoSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }
  const data = parsed.data
  const lineas = lineasConContenido(data.lineas)
  const total = calcularTotalOT(lineas)
  const id = String(Date.now())

  try {
    await db.transaction(async (tx) => {
      const numero = await siguienteNumeroOT(tx)
      await tx.insert(maintenanceOrders).values({
        id,
        numero,
        fecha: data.fecha,
        categoria: data.categoria,
        activo: data.activo || null,
        descripcion: data.descripcion || null,
        proveedorCodigo: data.proveedorCodigo || null,
        total: String(total),
        estado: ESTADO_ABIERTA,
      })
      if (lineas.length)
        await tx
          .insert(maintenanceOrderLines)
          .values(lineas.map((l) => aLineaColumnas(id, l)))
    })
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo crear la orden",
    }
  }

  revalidar()
  return { ok: true }
}

// Edita una OT (cabecera + reemplazo de líneas). No re-sincroniza una factura ya
// registrada (paridad monolito: la factura es independiente).
export const editarOrden = async (
  id: string,
  input: unknown,
): Promise<ActionResult> => {
  await requirePermiso("mantenciones.crear")
  const parsed = ordenTrabajoSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }
  const data = parsed.data
  const lineas = lineasConContenido(data.lineas)
  const total = calcularTotalOT(lineas)

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(maintenanceOrders)
        .set({
          fecha: data.fecha,
          categoria: data.categoria,
          activo: data.activo || null,
          descripcion: data.descripcion || null,
          proveedorCodigo: data.proveedorCodigo || null,
          total: String(total),
          updatedAt: new Date(),
        })
        .where(eq(maintenanceOrders.id, id))
      await tx
        .delete(maintenanceOrderLines)
        .where(eq(maintenanceOrderLines.orderId, id))
      if (lineas.length)
        await tx
          .insert(maintenanceOrderLines)
          .values(lineas.map((l) => aLineaColumnas(id, l)))
    })
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo editar la orden",
    }
  }

  revalidar()
  return { ok: true }
}

// Elimina una OT. Si está facturada, revierte primero su movimiento de inventario.
export const eliminarOrden = async (input: unknown): Promise<ActionResult> => {
  await requirePermiso("mantenciones.eliminar")
  const parsed = otIdSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }
  const { id } = parsed.data

  try {
    await db.transaction(async (tx) => {
      const [ot] = await tx
        .select({ factura: maintenanceOrders.factura })
        .from(maintenanceOrders)
        .where(eq(maintenanceOrders.id, id))
        .limit(1)
      if (!ot) throw new Error("Orden no encontrada")
      const factura = narrowFactura(ot.factura)
      if (factura?.movimiento) await revertirMovimiento(tx, factura.movimiento)
      await tx.delete(maintenanceOrders).where(eq(maintenanceOrders.id, id))
    })
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo eliminar la orden",
    }
  }

  revalidarConStock()
  return { ok: true }
}

// Registra la factura de una OT: genera un movimiento de ENTRADA SERVICIO/MANTENCION
// en la bodega de servicios (BSERV, producto de la categoría, costo = monto neto),
// recalcula el PPP y marca la OT como Facturada. Reusa el motor de Movimientos.
export const registrarFactura = async (
  input: unknown,
): Promise<ActionResult> => {
  await requirePermiso("mantenciones.facturar")
  const parsed = facturaSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }
  const data = parsed.data

  const usuario = await getUsuarioActual()
  if (!usuario) return { ok: false, error: "Sesión no válida" }

  try {
    await db.transaction(async (tx) => {
      const [ot] = await tx
        .select()
        .from(maintenanceOrders)
        .where(eq(maintenanceOrders.id, data.otId))
        .limit(1)
      if (!ot) throw new Error("Orden no encontrada")
      if (ot.estado === ESTADO_FACTURADA)
        throw new Error("La orden ya tiene una factura registrada")
      if (!ot.proveedorCodigo)
        throw new Error("Asigne un proveedor a la OT antes de facturar")

      const categoria = ot.categoria ?? ""
      await ensureBodegaServicios(tx)
      const prod = await ensureProductoServicio(tx, categoria)

      const lineasOt = await tx
        .select()
        .from(maintenanceOrderLines)
        .where(eq(maintenanceOrderLines.orderId, ot.id))
      const observaciones = construirObservacionFactura({
        numeroOT: ot.numero,
        categoria,
        activo: ot.activo ?? "",
        horometro: data.horometro,
        obs: data.obs,
        lineas: lineasOt.map((l) => ({
          tipo: l.tipo ?? "",
          productoNombre: l.productoNombre ?? "",
          detalle: l.detalle ?? "",
        })),
      })

      const numMov = await insertarMovimiento(tx, {
        tipoMovimiento: TIPO_MOVIMIENTO_SERVICIO,
        fecha: new Date(data.fecha),
        bodegaId: MANT_WAREHOUSE_ID,
        proveedorCodigo: ot.proveedorCodigo,
        tipoDoc: data.tipoDoc.toUpperCase(),
        numeroDoc: data.numeroDoc,
        documento: `${data.tipoDoc} ${data.numeroDoc}`,
        observaciones,
        usuario: usuario.nombre,
        lineas: [
          {
            codigoInterno: prod.codigo,
            descripcion: descripcionMovimientoFactura(categoria, ot.numero),
            unidadMedida: MANT_UNIDAD_PRODUCTO,
            cantidad: 1,
            costo: data.monto,
          },
        ],
      })
      await recalcularStockScoped(tx, [prod.codigo])

      await tx
        .update(maintenanceOrders)
        .set({
          estado: ESTADO_FACTURADA,
          factura: {
            tipoDoc: data.tipoDoc,
            numeroDoc: data.numeroDoc,
            fecha: data.fecha,
            monto: data.monto,
            obs: data.obs,
            horometro: data.horometro,
            movimiento: numMov,
          },
          updatedAt: new Date(),
        })
        .where(eq(maintenanceOrders.id, ot.id))
    })
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo registrar la factura",
    }
  }

  revalidarConStock()
  return { ok: true }
}

// Elimina la factura de una OT: revierte el movimiento y la vuelve a Abierta.
export const eliminarFactura = async (
  input: unknown,
): Promise<ActionResult> => {
  await requirePermiso("mantenciones.eliminar")
  const parsed = otIdSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }
  const { id } = parsed.data

  try {
    await db.transaction(async (tx) => {
      const [ot] = await tx
        .select({ factura: maintenanceOrders.factura })
        .from(maintenanceOrders)
        .where(eq(maintenanceOrders.id, id))
        .limit(1)
      if (!ot) throw new Error("Orden no encontrada")
      const factura = narrowFactura(ot.factura)
      if (!factura) throw new Error("La orden no tiene factura registrada")
      if (factura.movimiento) await revertirMovimiento(tx, factura.movimiento)
      await tx
        .update(maintenanceOrders)
        .set({ estado: ESTADO_ABIERTA, factura: null, updatedAt: new Date() })
        .where(eq(maintenanceOrders.id, id))
    })
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo eliminar la factura",
    }
  }

  revalidarConStock()
  return { ok: true }
}

// Exporta todas las OT a Excel (hoja Órdenes + hoja Detalle líneas), generado en
// el servidor con exceljs (SPEC). El cliente decodifica el base64 a Blob.
export const exportarMantencionesExcel = async (): Promise<ExportResult> => {
  await requirePermiso("mantenciones.ver")
  const { rows } = await getMantenciones()

  const lineasRaw = await db
    .select({
      numeroOT: maintenanceOrders.numero,
      tipo: maintenanceOrderLines.tipo,
      detalle: maintenanceOrderLines.detalle,
      productoNombre: maintenanceOrderLines.productoNombre,
      cantidad: maintenanceOrderLines.cantidad,
      valorUnit: maintenanceOrderLines.valorUnit,
    })
    .from(maintenanceOrderLines)
    .innerJoin(
      maintenanceOrders,
      eq(maintenanceOrderLines.orderId, maintenanceOrders.id),
    )
    .orderBy(asc(maintenanceOrders.numero), asc(maintenanceOrderLines.id))

  const libro = new ExcelJS.Workbook()
  const hojaOT = libro.addWorksheet("Órdenes de Trabajo")
  hojaOT.columns = [
    { header: "N° OT", key: "numero", width: 14 },
    { header: "Fecha", key: "fecha", width: 12 },
    { header: "Categoría", key: "categoria", width: 22 },
    { header: "Activo", key: "activo", width: 24 },
    { header: "Descripción", key: "descripcion", width: 30 },
    { header: "Proveedor", key: "proveedorNombre", width: 24 },
    { header: "Total", key: "total", width: 14 },
    { header: "Estado", key: "estado", width: 12 },
    { header: "N° Factura", key: "numeroDoc", width: 14 },
  ]
  hojaOT.addRows(rows)

  const hojaDet = libro.addWorksheet("Detalle líneas")
  hojaDet.columns = [
    { header: "N° OT", key: "numeroOT", width: 14 },
    { header: "Tipo", key: "tipo", width: 18 },
    { header: "Detalle", key: "detalle", width: 32 },
    { header: "Cantidad", key: "cantidad", width: 12 },
    { header: "Valor Unit", key: "valorUnit", width: 14 },
    { header: "Subtotal", key: "subtotal", width: 14 },
  ]
  hojaDet.addRows(
    lineasRaw.map((l) => {
      const cantidad = Number(l.cantidad)
      const valorUnit = Number(l.valorUnit)
      return {
        numeroOT: l.numeroOT,
        tipo: l.tipo ?? "",
        detalle: l.detalle || l.productoNombre || "",
        cantidad,
        valorUnit,
        subtotal: cantidad * valorUnit,
      }
    }),
  )

  const buffer = await libro.xlsx.writeBuffer()
  const base64 = Buffer.from(buffer).toString("base64")
  return { ok: true, base64, filename: "mantenciones.xlsx" }
}
