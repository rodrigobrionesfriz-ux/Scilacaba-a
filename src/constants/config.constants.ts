// Constantes de Configuración (regla 7). Hoja: no importa otras capas.
export const CONFIG_TITLE = "Configuración"
export const CONFIG_SUBTITLE = "Empresa, catálogos, indicadores y respaldo"

// Claves del store config (tabla key-value clave/valor jsonb).
export const EMPRESA_KEY = "empresa"
export const INDICADORES_KEY = "indicadoresDiarios"

// Meses de una temporada agrícola (Mayo→Abril), verbatim del monolito
// (index.html:9179).
export const PZ_MESES_TEMP = [
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
] as const

// Temporada histórica que siempre se ofrece en el selector (datos migrados).
export const TEMPORADA_HISTORICA = "2025-2026"
