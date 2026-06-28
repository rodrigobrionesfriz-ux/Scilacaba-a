export type Alcance = "conStock" | "todos"

export type EstadoToma =
  | "EN_PROCESO"
  | "PENDIENTE_AUTORIZACION"
  | "AUTORIZADA"
  | "APLICADA"
  | "DEVUELTA"
  | "RECHAZADA"

// Línea teórica que arma getStockParaToma al iniciar una toma (snapshot del stock).
// teorico/costoTeorico quedan congelados: el costo del ajuste usa costoTeorico.
export type TomaLineaTeorica = {
  codigoInterno: string
  descripcion: string
  unidadMedida: string
  manejaAtributos: boolean
  loteId: string | null
  lote: string | null
  fechaVenc: string | null
  teorico: number
  costoTeorico: number
}

// Línea completa de una toma (cabecera + captura), para detalle/captura/diff.
export type TomaLinea = TomaLineaTeorica & {
  id: number
  fisico: number | null
  fisicoIngresado: boolean
  asumidoCero: boolean
}

// Fila del listado de tomas (agregados de líneas precalculados en la query).
export type TomaRow = {
  id: string
  numero: string
  bodegaId: string
  bodega: string
  estado: EstadoToma
  alcance: Alcance
  usuario: string
  totalLineas: number
  conteadas: number
  conDiferencia: number
  creadoAt: string
}

// Toma + líneas para la vista de detalle/captura/autorización.
export type TomaDetalle = {
  id: string
  numero: string
  bodegaId: string
  bodega: string
  estado: EstadoToma
  alcance: Alcance
  filtroGrupo: string
  filtroTipo: string
  observaciones: string
  usuario: string
  autorizadoPor: string
  devolucionMotivo: string
  rechazoMotivo: string
  movimientosGenerados: string[]
  creadoAt: string
  cerradoAt: string | null
  autorizadoAt: string | null
  aplicadoAt: string | null
  lineas: TomaLinea[]
}

// Ajuste consolidado que se vuelve una línea de movimiento TIE/TIS al aplicar.
export type AjusteLinea = {
  codigoInterno: string
  descripcion: string
  unidadMedida: string
  cantidad: number
  costo: number
  lote: string
  fechaVenc: string
  loteId: string
}

// Resultado de comparar físico vs teórico: sobrantes → TIE, faltantes → TIS.
export type AjustesToma = {
  sobrantes: AjusteLinea[]
  faltantes: AjusteLinea[]
}
