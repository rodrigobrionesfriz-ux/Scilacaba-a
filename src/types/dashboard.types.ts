// Tipos del dashboard (regla 12). Hoja.
export type MovimientoResumen = {
  numero: string
  tipoMovimiento: string
  direccion: "ENT" | "SAL"
  fecha: string
  bodega: string
  producto: string
  items: number
  valor: number
}

export type StockBajoRow = {
  codigoInterno: string
  descripcion: string
  bodega: string
  cantidad: number
  minimo: number
}

export type DashboardStats = {
  totalProductos: number
  totalBodegas: number
  totalMovimientos: number
  valorInventario: number
  valorServicios: number
  stockBajoCount: number
  porVencerCount: number
  comprasUrgentesCount: number
  movimientosRecientes: MovimientoResumen[]
  stockBajo: StockBajoRow[]
}
