// Constantes de Productos (regla 7). Hoja: no importa otras capas.

export const PRODUCTOS_TITLE = "Productos"
export const PRODUCTOS_SUBTITLE = "Catálogo de productos del inventario"

// Unidades de medida del monolito (index.html:4898).
export const UNIDADES_MEDIDA = [
  "UN",
  "KG",
  "GR",
  "LT",
  "ML",
  "MT",
  "M2",
  "M3",
  "CJ",
  "PQ",
  "TON",
  "PZ",
  "MR",
] as const

// Correlativo de código interno: "P" + número con padding (index.html:3999-4004).
export const PREFIJO_PRODUCTO = "P"
export const CODIGO_PRODUCTO_PADDING = 6
export const COUNTER_PRODUCTO = "PRODUCTO"
