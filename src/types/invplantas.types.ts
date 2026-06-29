import type {
  ESTADOS_PLANTA_VALUES,
  TIPOS_PLANTA,
} from "@/constants/terreno.constants"

// Tipos del Inventario de huerto (regla 12). Importa solo constantes. Módulo
// offline (ADR-003): la captura escribe en Dexie y se sube por upsert idempotente.

// Estado de una planta (index.html: IP_ESTADOS).
export type EstadoPlanta = (typeof ESTADOS_PLANTA_VALUES)[number]

// Tipo de planta en la hilera: variedad principal o polinizante.
export type TipoPlanta = (typeof TIPOS_PLANTA)[number]

// Punto GPS capturado en un extremo de la hilera. precision/hora opcionales.
export type Gps = {
  lat: number
  lng: number
  precision: number | null
  hora: string | null
}

// Un paso de la caminata por la entrehilera: el tipo de planta contada y el
// estado elegido al sumarla. `secuencia` (el orden real) es la fuente de verdad.
export type PasoSecuencia = {
  tipo: TipoPlanta
  estado: EstadoPlanta
}

// Una planta individual ya numerada (con código y GPS interpolado). Se genera
// autoritativamente en el servidor al sincronizar, a partir de la secuencia.
export type PlantaCapturada = {
  seq: number
  codigo: string
  tipo: TipoPlanta
  estado: EstadoPlanta
  lat: number | null
  lng: number | null
}

// Sesión de inventario tal como se captura/sincroniza (unidad de subida a la
// nube). El servidor genera `plantas[]` y los contadores desde `secuencia`.
export type SesionInvplanta = {
  id: string
  cuartelId: number | null
  cuartel: string
  variedad: string
  portainjerto: string
  polinizante: string
  hilera: string
  codigoBase: string
  usuario: string
  secuencia: PasoSecuencia[]
  gpsInicio: Gps | null
  gpsFin: Gps | null
  fechaInicio: string
  fechaFin: string | null
}

// Registro local en IndexedDB (Dexie): la sesión + estado de sincronización.
export type InvplantaLocal = SesionInvplanta & {
  sincronizado: boolean
  fechaSync: string | null
}

// Opción de cuartel (paño) para el selector de captura (subconjunto de PanoRow).
export type CuartelOpcion = {
  id: number
  nombre: string
  variedad: string
  plantas: number | null
}

// Fila leída desde Postgres para la vista de revisión (online). Incluye las
// plantas ya narrowed para que el mapa 2D y el resumen rendericen sin otra query.
export type InvplantaRow = {
  id: string
  cuartelId: number | null
  cuartel: string
  variedad: string
  hilera: string
  codigoBase: string
  portainjerto: string
  polinizante: string
  usuario: string
  countPrincipal: number
  countPoliniz: number
  invertida: boolean
  plantas: PlantaCapturada[]
  fechaInicio: string
  fechaSync: string | null
}

// Resumen agregado por cuartel + variedad (index.html: ipRenderResumenPanos).
export type ResumenPano = {
  clave: string
  cuartelId: number | null
  cuartel: string
  variedad: string
  nHileras: number
  totalPlantas: number
  principal: number
  poliniz: number
  estados: Record<EstadoPlanta, number>
}
