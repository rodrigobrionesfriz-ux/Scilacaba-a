// Constantes de Servicio y Mantención (paridad monolito). Hoja: no importa capas.

// Correlativo de la OT (counters.OT → "OT-000001", ...). 6 dígitos (paridad monolito).
export const PREFIJO_OT = "OT"
export const OT_PADDING = 6

// Estados de la OT (verbatim del monolito). "Anulada" existe en el legacy pero
// nunca se asignaba (sin transición implementada) → no se replica.
export const ESTADO_ABIERTA = "Abierta"
export const ESTADO_FACTURADA = "Facturada"

export type EstadoOtMeta = {
  label: string
  variant: "default" | "secondary" | "outline" | "destructive"
}

export const OT_ESTADOS: Record<string, EstadoOtMeta> = {
  [ESTADO_ABIERTA]: { label: "Abierta", variant: "outline" },
  [ESTADO_FACTURADA]: { label: "Facturada", variant: "default" },
}

// Categorías de OT (verbatim del monolito).
export const MANT_CATEGORIAS = [
  "Maquinarias",
  "Torres Control Helada",
  "Instalaciones",
  "Riego",
  "Servicios",
] as const

// Tipos de línea de detalle (verbatim del monolito).
export const MANT_TIPOS_DETALLE = [
  "Mano de obra",
  "Repuestos",
  "Accesorios",
  "Insumos",
  "Servicio externo",
  "Otro",
] as const

// Tipos de documento de la factura (verbatim del monolito).
export const TIPOS_DOC_FACTURA = ["Factura", "Boleta", "Factura Exenta"] as const

// Bodega dedicada a servicios (productos no inventariables: registra valor, no
// controla stock físico). Se autoprovisiona al facturar (ensureBodegaServicios).
export const MANT_WAREHOUSE_ID = "BSERV"
export const MANT_WAREHOUSE_NOMBRE = "Servicios"

// Tipo de movimiento que genera la facturación (registrado en movimientos.constants
// con prefijo SERV y dirección ENT).
export const TIPO_MOVIMIENTO_SERVICIO = "SERVICIO/MANTENCION"

// Producto de servicio genérico por categoría (verbatim del monolito). El movimiento
// de factura usa el de la categoría de la OT.
export type ProductoServicio = { codigo: string; descripcion: string }

export const MANT_PRODUCTOS: Record<string, ProductoServicio> = {
  Maquinarias: { codigo: "SERV-MAQ", descripcion: "Mantención Maquinarias" },
  "Torres Control Helada": {
    codigo: "SERV-TOR",
    descripcion: "Mantención Torres Control Helada",
  },
  Instalaciones: {
    codigo: "SERV-INS",
    descripcion: "Mantención Instalaciones",
  },
  Riego: { codigo: "SERV-RIE", descripcion: "Mantención Riego" },
  Servicios: {
    codigo: "SERV-SER",
    descripcion: "Servicios (control/monitoreo de plagas, asesorías, otros)",
  },
}

// Fallback cuando la categoría no está mapeada (monolito → 'Maquinarias').
export const MANT_PRODUCTO_DEFAULT: ProductoServicio = MANT_PRODUCTOS.Maquinarias

// Grupo/tipo del producto de servicio autoprovisionado.
export const MANT_TIPO_PRODUCTO = "SERVICIO"
export const MANT_GRUPO_PRODUCTO = "Mantenciones"
export const MANT_UNIDAD_PRODUCTO = "UN"

// Títulos/subtítulos de las pantallas (regla 7).
export const MANTENCIONES_TITLE = "Servicio y Mantención"
export const MANTENCIONES_SUBTITLE =
  "Órdenes de trabajo, mantención de equipos y facturación de servicios"
