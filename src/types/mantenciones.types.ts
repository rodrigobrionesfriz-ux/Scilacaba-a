// Tipos de dominio de Servicio y Mantención (lectura). Los inputs validados viven
// en @/schemas/mantenciones.schema. Hoja: no importa capas superiores.

// Factura embebida de una OT (blob jsonb en maintenance_orders.factura). El número
// de movimiento SCI generado al facturar se guarda en `movimiento` (vínculo OT↔mov).
export type FacturaOT = {
  tipoDoc: string
  numeroDoc: string
  fecha: string
  monto: number
  obs: string
  horometro: number | null
  movimiento: string
}

// Línea de OT para lectura/detalle (con subtotal derivado).
export type LineaOTView = {
  id: number
  tipo: string
  productoCodigo: string | null
  productoNombre: string | null
  detalle: string
  cantidad: number
  valorUnit: number
  subtotal: number
}

// Fila de la tabla de OT.
export type MantencionRow = {
  id: string
  numero: string
  fecha: string
  categoria: string
  activo: string
  descripcion: string
  proveedorCodigo: string | null
  proveedorNombre: string
  total: number
  estado: string
  numeroDoc: string
}

// Detalle completo de una OT (cabecera + líneas + factura).
export type MantencionDetalle = MantencionRow & {
  lineas: LineaOTView[]
  factura: FacturaOT | null
}

// KPIs del dashboard del módulo.
export type MantencionKpis = {
  total: number
  abiertas: number
  facturadas: number
  montoTotal: number
}

// Opción de proveedor para el selector del form de OT.
export type ProveedorOption = { codigo: string; nombre: string }

// Opción de producto de servicio para el selector de líneas.
export type ProductoServicioOption = {
  codigo: string
  descripcion: string
  unidadMedida: string
}
