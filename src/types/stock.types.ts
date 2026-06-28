// Tipos de display del módulo de stock (regla 12). Hoja: no importa otras capas.

// Fila de la tabla de stock por bodega (producto × bodega + valorización).
export type StockRow = {
  codigoInterno: string
  descripcion: string
  unidadMedida: string
  bodegaId: string
  bodega: string
  cantidad: number
  costoPromedio: number
  valor: number
}

// Resumen agregado de stock por producto (columnas diferidas en Productos).
export type StockResumenProducto = {
  codigoInterno: string
  cantidad: number
  valor: number
}

// Resumen agregado de stock por bodega (columnas diferidas en Bodegas).
export type StockResumenBodega = {
  bodegaId: string
  items: number
  valor: number
}
