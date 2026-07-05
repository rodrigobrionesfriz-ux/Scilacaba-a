// Faltante de un producto para una orden concreta (regla 12). Hoja.
export type OrdenFaltante = {
  id: number
  numero: string
  fecha: string
  requerido: number
  falta: number
}

// Producto agrupado en la lista de Compra Urgente (suma de faltantes por orden).
export type CompraUrgente = {
  producto: string
  unidad: string
  disponible: number
  enBodega: boolean
  totalFalta: number
  ordenes: OrdenFaltante[]
}
