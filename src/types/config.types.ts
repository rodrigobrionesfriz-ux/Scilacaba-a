// Datos de la empresa (blob config.empresa). El type vive en la capa types para
// que lo puedan usar tanto el schema (validación) como los utils (narrowing) sin
// cruzar boundaries (utils no puede importar schemas).
export type Empresa = {
  nombre: string
  rut: string
  direccion: string
  giro: string
  telefono: string
  correo: string
  logo: string
  recupIEC: boolean
}

// Indicadores diarios (USD/UTM/UF) por mes dentro de una temporada. Origen: blob
// config.indicadoresDiarios (index.html:9204). Los campos son opcionales: un mes
// puede no tener alguno de los tres valores.
export type IndicadoresMes = {
  usd?: number
  utm?: number
  uf?: number
}

export type IndicadoresRoot = {
  temporadas: Record<string, Record<string, IndicadoresMes>>
}

// Tipo de producto tal como se lista en el CRUD de configuración (incluye activo,
// a diferencia de ProductType que solo alimenta el select de Productos).
export type TipoRow = {
  nombre: string
  descripcion: string | null
  activo: boolean
}

// Fila editable de la tabla de indicadores (un mes). Valores null = sin dato.
// Compartida por el schema de guardado y los utils (los utils no importan schemas).
export type IndicadorFila = {
  mes: string
  usd: number | null
  utm: number | null
  uf: number | null
}
