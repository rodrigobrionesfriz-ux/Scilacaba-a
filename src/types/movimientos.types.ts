export type Direccion = "ENT" | "SAL"

// Línea mínima que el PPP necesita (subset de movement_lines).
export type MovimientoLineaPpp = {
  codigoInterno: string
  cantidad: number
  costo: number
  lote?: string | null
  fechaVenc?: string | null
}

// Movimiento mínimo que el PPP necesita (subset de movements + sus líneas).
export type MovimientoPpp = {
  numero: string
  direccion: Direccion
  tipoMovimiento: string
  fecha: string
  creadoAt?: string | null
  bodegaId: string
  bodegaDestinoId?: string | null
  anulado?: boolean
  lineas: MovimientoLineaPpp[]
}

export type ProductoAtributos = {
  codigoInterno: string
  manejaAtributos: boolean
}

export type StockPpp = {
  codigoInterno: string
  bodegaId: string
  cantidad: number
  costoPromedio: number
}

export type LotePpp = {
  id: string
  codigoInterno: string
  bodegaId: string
  lote: string
  fechaVenc: string | null
  cantidad: number
  costo: number
}

export type ResultadoPpp = {
  stock: StockPpp[]
  lots: LotePpp[]
}

// Fila de la lista de movimientos (shape de display, más laxo que el subset PPP).
export type MovimientoRow = {
  numero: string
  fecha: string
  direccion: Direccion
  tipoMovimiento: string
  bodega: string
  bodegaDestino: string
  contraparte: string
  totalLineas: number
  valor: number
  usuario: string
  anulado: boolean
}

// Línea de un movimiento para la vista de detalle.
export type MovimientoLineaDetalle = {
  id: number
  codigoInterno: string
  descripcion: string
  unidadMedida: string
  cantidad: number
  costo: number
  lote: string
  fechaVenc: string
}

// Estado de una línea en el formulario de creación (todo string para inputs).
export type MovimientoLineaForm = {
  codigoInterno: string
  descripcion: string
  unidadMedida: string
  cantidad: string
  costo: string
  lote: string
  fechaVenc: string
}

// Movimiento + líneas para la vista de detalle.
export type MovimientoDetalle = {
  numero: string
  fecha: string
  direccion: Direccion
  tipoMovimiento: string
  bodega: string
  bodegaDestino: string
  proveedor: string
  cliente: string
  centroCosto: string
  documento: string
  numeroDoc: string
  observaciones: string
  usuario: string
  autorizadoPor: string
  anulado: boolean
  lineas: MovimientoLineaDetalle[]
}
