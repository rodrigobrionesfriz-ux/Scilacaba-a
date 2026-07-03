// Constantes del módulo Presupuesto (paridad monolito). Hoja: no importa capas.

// Títulos de la pantalla (regla 7).
export const PRESUPUESTO_TITLE = "Control de Presupuesto"
export const PRESUPUESTO_SUBTITLE =
  "Dashboard gerencial · Presupuesto vs Real por temporada"

// Orden de meses de la temporada agrícola: mayo → abril (verbatim del monolito,
// index.html:19050). Idx 0..7 = mayo..diciembre (inicio de temporada), 8..11 =
// enero..abril (año siguiente).
export const MESES_ORDEN = [
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

// Monedas del toggle CLP/USD (index.html:18550).
export const MONEDA_CLP = "CLP"
export const MONEDA_USD = "USD"

// Límites de los gráficos/tablas (verbatim del monolito).
export const DESC_CHART_LIMIT = 15
export const TOP_DESVIACIONES_LIMIT = 8

// Paleta del donut por sub-grupo (index.html:19435) + series ppto/real.
export const COLOR_PPTO = "#3b82f6"
export const COLOR_REAL = "#16c784"
export const COLOR_SOBRE = "#ef4444"
export const COLOR_BAJO = "#16a34a"
export const COLORES_SUBGRUPO = [
  "#16c784",
  "#3b82f6",
  "#f5a623",
  "#a78bfa",
  "#22d3ee",
] as const

// --- Importación de Excel (index.html:18840-18934) ---
export const HOJA_BASE = "Base"
export const HOJA_DETALLE = "Detalle Gastos"
// Columnas mínimas que debe tener la hoja "Base".
export const COLUMNAS_EXCEL_REQUERIDAS = [
  "TIPO",
  "MES",
  "AÑO",
  "SUB-GRUPO",
  "TIPO DE COSTO",
  "DESCRIPCION",
  "MONTO REAL",
] as const
// Columna del monto presupuestado. El monolito detecta "PPTO AJUSTADO KG" pero
// nunca la usa (código muerto, index.html:18872): el merge siempre lee "MONTO PPTO"
// → replicamos ese comportamiento para reproducir los datos ya migrados.
export const COL_PPTO = "MONTO PPTO"
export const COL_REAL = "MONTO REAL"
// Discriminador de fila: PRESUPUESTO vs REAL.
export const TIPO_FILA_PRESUPUESTO = "PRESUPUESTO"
export const TIPO_FILA_REAL = "REAL"

// --- Criterios por Temporada ---
// Los criterios viven en la tabla `config` (fila con esta clave). Shape verbatim
// del monolito (index.html:20205): { key, items[], _updatedAt }.
export const PZ_CRITERIOS_KEY = "pz_criterios"
// Tipos de gasto/evento sugeridos en el selector (index.html:20264).
export const TIPOS_GASTO_CRITERIO = [
  "Poda",
  "Raleo",
  "Cosecha",
  "Fertilización",
  "Fitosanitario",
  "Riego",
  "Mano de Obra",
  "Contratista",
  "Maquinaria",
  "Otros",
] as const
