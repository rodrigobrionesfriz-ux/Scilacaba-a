// Tipos de movimiento y correlativos (paridad monolito). Hoja: no importa capas.

// Tipos con tratamiento especial (referenciados por schema/action; regla 7: nunca inline).
export const COMPRA = "COMPRA"
export const VENTA = "VENTA"
export const TRASPASO_BODEGA = "TRASPASO BODEGA"
export const DEVOLUCION_PROVEEDOR = "DEVOLUCION PROVEEDOR"
export const CONSUMO_CC = "CONSUMO CC"
export const DEVOLUCION_CC = "DEVOLUCION CC"

export const TIPOS_MOV_ENT = [
  COMPRA,
  "COSECHA A STOCK",
  DEVOLUCION_CC,
  "TOMA INVENTARIO ENT",
  "MUESTRA GRATIS",
]

export const TIPOS_MOV_SAL = [
  VENTA,
  CONSUMO_CC,
  TRASPASO_BODEGA,
  "MERMA",
  DEVOLUCION_PROVEEDOR,
  "TOMA INVENTARIO SAL",
]

export const PREFIJO_MOV: Record<string, string> = {
  [COMPRA]: "COMP",
  "COSECHA A STOCK": "COS",
  [DEVOLUCION_CC]: "DCC",
  "TOMA INVENTARIO ENT": "TIE",
  "MUESTRA GRATIS": "MUE",
  [VENTA]: "VTA",
  [CONSUMO_CC]: "CCC",
  [TRASPASO_BODEGA]: "TRB",
  MERMA: "MER",
  [DEVOLUCION_PROVEEDOR]: "DEV",
  "TOMA INVENTARIO SAL": "TIS",
}

// Tipos que exigen proveedor / cliente / centro de costo (validación condicional).
export const TIPOS_REQUIEREN_PROVEEDOR = [COMPRA, DEVOLUCION_PROVEEDOR]
export const TIPOS_REQUIEREN_CLIENTE = [VENTA]
export const TIPOS_REQUIEREN_CENTRO_COSTO = [CONSUMO_CC, DEVOLUCION_CC]

// Etiquetas de dirección para badges.
export const DIRECCION_LABEL: Record<string, string> = {
  ENT: "Entrada",
  SAL: "Salida",
}

// Títulos/subtítulos de las pantallas (regla 7).
export const MOVIMIENTOS_TITLE = "Movimientos"
export const MOVIMIENTOS_SUBTITLE =
  "Libro mayor de entradas y salidas de inventario"

export const STOCK_TITLE = "Stock por Bodega"
export const STOCK_SUBTITLE = "Existencias actuales y valorización (PPP)"

export const NUEVA_ENTRADA_TITLE = "Nueva Entrada"
export const NUEVA_ENTRADA_SUBTITLE = "Registra una entrada de inventario"
export const NUEVA_SALIDA_TITLE = "Nueva Salida"
export const NUEVA_SALIDA_SUBTITLE = "Registra una salida de inventario"
