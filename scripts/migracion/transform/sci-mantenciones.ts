import { maintenanceOrderLines, maintenanceOrders } from "@/db/schema"
import type { SciPayload } from "@/schemas/firestore-sci.schema"
import {
  parseDateOnly,
  parseEpochMs,
  parseTimestamp,
  toNumericString,
} from "@/utils/migracion.utils"

export type FilasMantenciones = {
  maintenanceOrders: (typeof maintenanceOrders.$inferInsert)[]
  maintenanceOrderLines: (typeof maintenanceOrderLines.$inferInsert)[]
}

// Órdenes de mantención + líneas. proveedorCodigo es FK opcional: si el código no
// existe en el catálogo de proveedores, se deja null (no se aborta el lote).
export const transformMantenciones = (
  p: SciPayload,
  proveedorCodigos: Set<string>,
): FilasMantenciones => {
  const ordersRows: FilasMantenciones["maintenanceOrders"] = (
    p.mantenciones ?? []
  ).map((m) => ({
    id: m.id,
    numero: m.numero ?? "",
    fecha: parseDateOnly(m.fecha) ?? "1970-01-01",
    categoria: m.categoria ?? null,
    activo: m.activo ?? null,
    descripcion: m.descripcion ?? null,
    proveedorCodigo:
      m.proveedorCodigo && proveedorCodigos.has(m.proveedorCodigo)
        ? m.proveedorCodigo
        : null,
    total: toNumericString(m.total),
    estado: m.estado ?? "",
    factura: m.factura ?? null,
    creadoAt: parseTimestamp(m.creado) ?? undefined,
    updatedAt: parseEpochMs(m._mod) ?? parseTimestamp(m.modificado),
  }))

  const linesRows: FilasMantenciones["maintenanceOrderLines"] = []
  for (const m of p.mantenciones ?? []) {
    for (const l of m.lineas ?? []) {
      linesRows.push({
        orderId: m.id,
        tipo: l.tipo ?? null,
        productoCodigo: l.productoCodigo ?? null,
        productoNombre: l.productoNombre ?? null,
        detalle: l.detalle ?? null,
        cantidad: toNumericString(l.cantidad),
        valorUnit: toNumericString(l.valorUnit),
      })
    }
  }

  return {
    maintenanceOrders: ordersRows,
    maintenanceOrderLines: linesRows,
  }
}
