// Tipos de Fertirriego (regla 12). Filas de listado laxas, como ordenes.types.ts.

import type { FR_NUTRIENTES } from "@/constants/fertirriego.constants"

export type Nutriente = (typeof FR_NUTRIENTES)[number]

// Mapa nutriente → % en peso del producto (blob field_products.aportes).
export type Aportes = Partial<Record<Nutriente, number>>

// Fila del listado de sectores de riego.
export type SectorRow = {
  id: string
  nombre: string
  equipo: string
  ha: number | null
  variedad: string
  plantas: number | null
}

// Línea de producto de una OAF (blob fertirriego_ordenes.lineas[]).
export type LineaOaf = {
  prod: string
  dosis: number
  unidad: string
  obs: string
}

// Aporte nutricional total estimado de una orden (kg de cada nutriente).
export type AporteTotal = {
  nutriente: Nutriente
  kg: number
}

// Fila del listado de OAF (con nombres de sectores y há total derivados).
export type OafRow = {
  id: string
  numero: string
  fecha: string
  forma: string
  horario: string
  estado: string
  responsable: string
  sectores: string[]
  nombresSectores: string[]
  haTotal: number
  lineas: LineaOaf[]
  confirmada: boolean
  confirmadaFecha: string
}

// Producto del catálogo visible en fertirriego (con su composición editable).
export type ProductoFertRow = {
  nombre: string
  tipo: string
  unidad: string
  dosis: string
  aportes: Aportes
}

// Configuración singleton del módulo (blob fertirriego_config.cfg).
export type RangoFert = { especie: string; desde: number; hasta: number }
export type PredioFert = { predio: string; admin: string }

export type ConfigFert = {
  empresa: string
  temporada: string
  documento: string
  obsDefecto: string
  rangos: RangoFert[]
  estados: string[]
  condiciones: string[]
  equipos: string[]
  formas: string[]
  unidades: string[]
  horarios: string[]
  tiposDoc: string[]
  predios: PredioFert[]
}
