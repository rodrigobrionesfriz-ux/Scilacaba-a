import type { TIPOS_ARBOL } from "@/constants/terreno.constants"

// Tipos del módulo de Conteos en terreno (regla 12). Importa solo constantes.

// Tipo de un árbol contado: fijo (representativo) o al azar.
export type TipoArbol = (typeof TIPOS_ARBOL)[number]

// Un árbol capturado dentro de una sesión de conteo. centros = nº de centros
// florales contados. GPS opcional (puede faltar si el dispositivo no lo entrega).
export type ArbolCapturado = {
  n: number
  centros: number
  tipo: TipoArbol
  codigo: string
  lat: number | null
  lng: number | null
  precision: number | null
  fecha: string
}

// Sesión de conteo tal como se captura/sincroniza (unidad de subida a la nube).
// Las fechas viajan como ISO string (se serializan a/desde Dexie y la Server Action).
export type Conteo = {
  id: string
  panoId: number | null
  panoNombre: string
  variedad: string
  especie: string
  etapa: string
  fijosCodigos: string[]
  usuario: string
  arboles: ArbolCapturado[]
  promedioCentros: number
  nArboles: number
  fechaInicio: string
  fechaFin: string | null
}

// Registro local en IndexedDB (Dexie): la sesión + estado de sincronización.
export type ConteoLocal = Conteo & {
  sincronizado: boolean
  fechaSync: string | null
}

// Opción de paño para el selector de captura (subconjunto de PanoRow).
export type PanoOpcion = {
  id: number
  nombre: string
  variedad: string
}

// Fila plana leída desde Postgres para la vista de revisión (online).
export type ConteoRow = {
  id: string
  panoNombre: string
  variedad: string
  especie: string
  etapa: string
  usuario: string
  nArboles: number | null
  promedioCentros: number | null
  sincronizado: boolean
  fechaInicio: string
  fechaFin: string | null
  fechaSync: string | null
}
