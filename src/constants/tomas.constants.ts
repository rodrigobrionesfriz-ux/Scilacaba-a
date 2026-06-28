// Constantes de Tomas de inventario (paridad monolito). Hoja: no importa capas.

// Prefijo del correlativo de la toma (counters.TOMA → "TOMA-1", "TOMA-2", ...).
export const PREFIJO_TOMA = "TOMA"

// Tipos de movimiento que genera una toma al aplicarse (definidos en
// movimientos.constants: PREFIJO_MOV los mapea a TIE/TIS). Aquí solo se referencian.
export const TIPO_TOMA_ENT = "TOMA INVENTARIO ENT"
export const TIPO_TOMA_SAL = "TOMA INVENTARIO SAL"

// Estados de la toma (strings verbatim del monolito; la data migrada los usa así).
export const ESTADO_EN_PROCESO = "EN_PROCESO"
export const ESTADO_PENDIENTE = "PENDIENTE_AUTORIZACION"
export const ESTADO_AUTORIZADA = "AUTORIZADA"
export const ESTADO_APLICADA = "APLICADA"
export const ESTADO_DEVUELTA = "DEVUELTA"
export const ESTADO_RECHAZADA = "RECHAZADA"

// Estados en los que el dueño puede seguir capturando (reeditable).
export const ESTADOS_EDITABLES = [ESTADO_EN_PROCESO, ESTADO_DEVUELTA]

// Metadatos de cada estado para los badges de la UI (label + variante shadcn).
export type EstadoTomaMeta = {
  label: string
  variant: "default" | "secondary" | "outline" | "destructive"
}

export const TOMA_ESTADOS: Record<string, EstadoTomaMeta> = {
  [ESTADO_EN_PROCESO]: { label: "En proceso", variant: "outline" },
  [ESTADO_PENDIENTE]: { label: "Pendiente autorización", variant: "secondary" },
  [ESTADO_AUTORIZADA]: { label: "Autorizada", variant: "secondary" },
  [ESTADO_APLICADA]: { label: "Ajustes aplicados", variant: "default" },
  [ESTADO_DEVUELTA]: { label: "Devuelta al operador", variant: "outline" },
  [ESTADO_RECHAZADA]: { label: "Rechazada", variant: "destructive" },
}

// Alcance del conteo: solo lo que tiene stock vs todos los productos (filtrables).
export const ALCANCE_CON_STOCK = "conStock"
export const ALCANCE_TODOS = "todos"

export const ALCANCES = [
  { value: ALCANCE_CON_STOCK, label: "Solo productos con stock en la bodega" },
  { value: ALCANCE_TODOS, label: "Todos los productos" },
]

// Filtros de la pantalla de captura (qué líneas mostrar).
export const CAPTURA_FILTRO_TODAS = "todas"
export const CAPTURA_FILTRO_PENDIENTES = "pendientes"
export const CAPTURA_FILTRO_CON_DIF = "conDif"

// Títulos/subtítulos de las pantallas (regla 7).
export const TOMAS_TITLE = "Tomas de Inventario"
export const TOMAS_SUBTITLE =
  "Conteo físico de existencias y ajustes por diferencias"
