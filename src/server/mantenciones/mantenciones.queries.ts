import { and, asc, desc, eq } from "drizzle-orm"
import {
  ESTADO_ABIERTA,
  ESTADO_FACTURADA,
} from "@/constants/mantenciones.constants"
import { db } from "@/db/client"
import {
  maintenanceOrderLines,
  maintenanceOrders,
  products,
  providers,
} from "@/db/schema"
import type {
  LineaOTView,
  MantencionDetalle,
  MantencionKpis,
} from "@/types/mantenciones.types"
import { calcularSubtotal, narrowFactura } from "@/utils/mantenciones.utils"

// Lista de OT (con líneas + factura por fila) + KPIs del dashboard. Dos queries
// (cabeceras + todas las líneas) agrupadas en memoria, sin N+1. La fila lleva el
// detalle completo para alimentar Ver detalle / editar / facturar embebidos.
export const getMantenciones = async (): Promise<{
  rows: MantencionDetalle[]
  kpis: MantencionKpis
}> => {
  const [cabeceras, lineasRaw] = await Promise.all([
    db
      .select({
        id: maintenanceOrders.id,
        numero: maintenanceOrders.numero,
        fecha: maintenanceOrders.fecha,
        categoria: maintenanceOrders.categoria,
        activo: maintenanceOrders.activo,
        descripcion: maintenanceOrders.descripcion,
        proveedorCodigo: maintenanceOrders.proveedorCodigo,
        proveedorNombre: providers.razonSocial,
        total: maintenanceOrders.total,
        estado: maintenanceOrders.estado,
        factura: maintenanceOrders.factura,
      })
      .from(maintenanceOrders)
      .leftJoin(
        providers,
        eq(maintenanceOrders.proveedorCodigo, providers.codigo),
      )
      .orderBy(desc(maintenanceOrders.fecha), desc(maintenanceOrders.numero)),
    db
      .select()
      .from(maintenanceOrderLines)
      .orderBy(asc(maintenanceOrderLines.id)),
  ])

  const lineasPorOrden = new Map<string, LineaOTView[]>()
  for (const l of lineasRaw) {
    const cantidad = Number(l.cantidad)
    const valorUnit = Number(l.valorUnit)
    const arr = lineasPorOrden.get(l.orderId) ?? []
    arr.push({
      id: l.id,
      tipo: l.tipo ?? "",
      productoCodigo: l.productoCodigo,
      productoNombre: l.productoNombre,
      detalle: l.detalle ?? "",
      cantidad,
      valorUnit,
      subtotal: calcularSubtotal({ cantidad, valorUnit }),
    })
    lineasPorOrden.set(l.orderId, arr)
  }

  const rows: MantencionDetalle[] = cabeceras.map((f) => {
    const factura = narrowFactura(f.factura)
    return {
      id: f.id,
      numero: f.numero,
      fecha: f.fecha,
      categoria: f.categoria ?? "",
      activo: f.activo ?? "",
      descripcion: f.descripcion ?? "",
      proveedorCodigo: f.proveedorCodigo,
      proveedorNombre: f.proveedorNombre ?? "",
      total: Number(f.total),
      estado: f.estado,
      numeroDoc: factura?.numeroDoc ?? "",
      lineas: lineasPorOrden.get(f.id) ?? [],
      factura,
    }
  })

  const kpis: MantencionKpis = {
    total: rows.length,
    abiertas: rows.filter((r) => r.estado === ESTADO_ABIERTA).length,
    facturadas: rows.filter((r) => r.estado === ESTADO_FACTURADA).length,
    montoTotal: rows.reduce((acc, r) => acc + r.total, 0),
  }
  return { rows, kpis }
}

// Productos de servicio (no inventariables) para el selector de líneas de OT.
export const getProductosServicio = async (): Promise<
  { codigo: string; descripcion: string; unidadMedida: string }[]
> => {
  return db
    .select({
      codigo: products.codigoInterno,
      descripcion: products.descripcion,
      unidadMedida: products.unidadMedida,
    })
    .from(products)
    .where(and(eq(products.inventariable, false), eq(products.activo, true)))
    .orderBy(asc(products.descripcion))
}
