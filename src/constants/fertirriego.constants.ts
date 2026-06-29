// Constantes de Fertirriego (regla 7). Hoja: no importa otras capas.
// Listas verbatim del monolito (index.html) para preservar la funcionalidad (SPEC).

export const FERTIRRIEGO_ORDENES_TITLE = "Órdenes de fertirriego"
export const FERTIRRIEGO_ORDENES_SUBTITLE =
  "Órdenes de aplicación al suelo con aporte nutricional por sectores"

export const FERTIRRIEGO_SECTORES_TITLE = "Sectores y equipos"
export const FERTIRRIEGO_SECTORES_SUBTITLE = "Inventario de riego"

export const FERTIRRIEGO_PRODUCTOS_TITLE = "Productos y aportes"
export const FERTIRRIEGO_PRODUCTOS_SUBTITLE =
  "Composición nutricional de fertilizantes y enmiendas"

export const FERTIRRIEGO_PARAMETROS_TITLE = "Parámetros"
export const FERTIRRIEGO_PARAMETROS_SUBTITLE =
  "Listas editables y configuración del módulo"

// Sub-navegación interna de Fertirriego (espejo de las pestañas del monolito).
export const TABS_FERTIRRIEGO = [
  { href: "/cuaderno/fertirriego/ordenes", label: "Órdenes" },
  { href: "/cuaderno/fertirriego/sectores", label: "Sectores y equipos" },
  { href: "/cuaderno/fertirriego/productos", label: "Productos y aportes" },
  { href: "/cuaderno/fertirriego/parametros", label: "Parámetros" },
] as const

// Prefijo del correlativo de OAF (counters.OAF), formato OAF-00001 (padding a 5).
export const PREFIJO_OAF = "OAF"
export const OAF_PADDING = 5

// Nutrientes que se registran como % del producto (index.html:13631).
export const FR_NUTRIENTES = ["N", "P", "K", "Mg", "S", "Ca", "B", "Zn"] as const

// Tipos de producto que aplican a fertirriego (index.html:14114). Filtro lowercase.
export const TIPOS_FR = [
  "fertilizante suelo",
  "fertilizante edafico",
  "fertilizante edáfico",
  "enmienda",
] as const

// ─── Defaults de la configuración singleton (index.html:_ensureFertirriego 12486) ───
// Sirven de fallback cuando la cfg migrada no trae una lista.

export const EMPRESA_FERT_DEFAULT = "SOC. AGRICOLA Y FORESTAL LA CABAÑA LTDA"
export const TEMPORADA_FERT_DEFAULT = "2026-2027"
export const DOCUMENTO_FERT_DEFAULT = "ORDEN DE APLICACION"

export const ESTADOS_FERT_DEFAULT = [
  "YEMA INCHADA",
  "PUNTAS ALGODON",
  "PUNTAS VERDES",
  "RAMILLETE EXPUESTO",
  "BOTON BLANCO",
  "BOTON ROSADO",
  "INICIO FLORACION",
  "PLENA FLOR",
  "CAIDA DE PETALOS INICIO",
  "CAIDA DE PETALOS FINAL",
  "ESTADO T",
  "COSECHA INICIO",
  "COSECHA",
  "COSECHA FINAL",
  "CAIDA DE HOJAS 50% AMARILLO",
  "CAIDA DE HOJAS 50% CAIDA",
  "CAIDA DE HOJAS 100% CAIDA",
  "POSH COSECHA",
  "CRECIMIENTO FRUTO",
  "ESTADO BALON",
  "FLORACION",
  "CUAJA",
  "CAIDA DE PETALOS",
  "MULTIPLICACION CELULAR",
  "OREJA DE RATON",
  "PAJA/ CAMBIO COLOR",
  "PINTA",
] as const

export const CONDICIONES_FERT_DEFAULT = ["NORMAL", "DEBIL", "VIGOROSO"] as const
export const EQUIPOS_FERT_DEFAULT = ["EQ 1", "EQ 2"] as const
export const FORMAS_FERT_DEFAULT = ["POR GOTEO", "MANUAL", "ASPERSION"] as const
export const UNIDADES_FERT_DEFAULT = ["GRS.", "C.C", "L", "kg", "mL"] as const
export const HORARIOS_FERT_DEFAULT = [
  "08:00 A 17:00",
  "08:00 A 18:00",
  "18:00 A 21:00",
] as const
export const TIPOS_DOC_FERT_DEFAULT = [
  "ORDEN APLICACION",
  "CONFIRMACION",
] as const
export const RANGOS_FERT_DEFAULT = [
  { especie: "CEREZOS", desde: 1, hasta: 99 },
] as const

// ── Base de fertilizantes conocidos con su aporte nutricional (% elemental) ──
// Verbatim del monolito (index.html:13637). P y K expresados como ELEMENTO.
// patrones: palabras clave que deben estar TODAS en el nombre para coincidir.
export const FERTILIZANTES_BASE: ReadonlyArray<{
  nombre: string
  patrones: readonly string[]
  ap: Readonly<Partial<Record<(typeof FR_NUTRIENTES)[number], number>>>
}> = [
  // Nitrogenados
  { nombre: "Urea", patrones: ["urea"], ap: { N: 46 } },
  { nombre: "Nitrato de amonio", patrones: ["nitrato", "amonio"], ap: { N: 33 } },
  { nombre: "Sulfato de amonio", patrones: ["sulfato", "amonio"], ap: { N: 21, S: 24 } },
  { nombre: "Nitrato de calcio", patrones: ["nitrato", "calcio"], ap: { N: 15.5, Ca: 19 } },
  { nombre: "Nitrato de magnesio", patrones: ["nitrato", "magnesio"], ap: { N: 11, Mg: 9.5 } },
  { nombre: "Nitrato de potasio", patrones: ["nitrato", "potasio"], ap: { N: 13, K: 38 } },
  {
    nombre: "Nitrato de potasio (salitre potásico)",
    patrones: ["salitre", "potasico"],
    ap: { N: 15, K: 14 },
  },
  { nombre: "UAN 32", patrones: ["uan"], ap: { N: 32 } },
  // Fosfatados
  { nombre: "MAP (fosfato monoamónico)", patrones: ["map"], ap: { N: 12, P: 26 } },
  { nombre: "Fosfato monoamónico", patrones: ["fosfato", "monoamonico"], ap: { N: 12, P: 26 } },
  { nombre: "DAP (fosfato diamónico)", patrones: ["dap"], ap: { N: 18, P: 20 } },
  { nombre: "Fosfato diamónico", patrones: ["fosfato", "diamonico"], ap: { N: 18, P: 20 } },
  { nombre: "Fosfato monopotásico (MKP)", patrones: ["fosfato", "monopotasico"], ap: { P: 22.7, K: 28 } },
  { nombre: "MKP", patrones: ["mkp"], ap: { P: 22.7, K: 28 } },
  { nombre: "Ácido fosfórico", patrones: ["acido", "fosforico"], ap: { P: 23 } },
  { nombre: "Superfosfato triple", patrones: ["superfosfato", "triple"], ap: { P: 20, Ca: 14 } },
  {
    nombre: "Superfosfato normal",
    patrones: ["superfosfato", "normal"],
    ap: { P: 9, Ca: 20, S: 12 },
  },
  // Potásicos
  { nombre: "Cloruro de potasio (KCl)", patrones: ["cloruro", "potasio"], ap: { K: 50 } },
  { nombre: "Muriato de potasio", patrones: ["muriato", "potasio"], ap: { K: 50 } },
  { nombre: "Sulfato de potasio", patrones: ["sulfato", "potasio"], ap: { K: 42, S: 18 } },
  {
    nombre: "Sulfato de potasio y magnesio",
    patrones: ["sulfato", "potasio", "magnesio"],
    ap: { K: 18, Mg: 11, S: 22 },
  },
  { nombre: "Tiosulfato de potasio", patrones: ["tiosulfato", "potasio"], ap: { K: 25, S: 17 } },
  // Cálcicos / magnésicos / azufrados
  {
    nombre: "Sulfato de magnesio (sal de Epsom)",
    patrones: ["sulfato", "magnesio"],
    ap: { Mg: 9.8, S: 13 },
  },
  { nombre: "Sulfato de calcio (yeso)", patrones: ["sulfato", "calcio"], ap: { Ca: 23, S: 18 } },
  { nombre: "Yeso agrícola", patrones: ["yeso"], ap: { Ca: 23, S: 18 } },
  { nombre: "Cloruro de calcio", patrones: ["cloruro", "calcio"], ap: { Ca: 36 } },
  { nombre: "Tiosulfato de amonio", patrones: ["tiosulfato", "amonio"], ap: { N: 12, S: 26 } },
  { nombre: "Azufre elemental", patrones: ["azufre"], ap: { S: 90 } },
  // Enmiendas
  { nombre: "Cal (carbonato de calcio)", patrones: ["carbonato", "calcio"], ap: { Ca: 38 } },
  { nombre: "Cal agrícola", patrones: ["cal", "agricola"], ap: { Ca: 38 } },
  { nombre: "Dolomita", patrones: ["dolomita"], ap: { Ca: 21, Mg: 11 } },
  { nombre: "Cal dolomítica", patrones: ["cal", "dolomitica"], ap: { Ca: 21, Mg: 11 } },
  // Micronutrientes / boro / zinc
  { nombre: "Boro (ácido bórico)", patrones: ["acido", "borico"], ap: { B: 17 } },
  { nombre: "Borax / Boro", patrones: ["borax"], ap: { B: 11 } },
  { nombre: "Boro", patrones: ["boro"], ap: { B: 11 } },
  { nombre: "Sulfato de zinc", patrones: ["sulfato", "zinc"], ap: { Zn: 35, S: 17 } },
  { nombre: "Quelato de zinc", patrones: ["quelato", "zinc"], ap: { Zn: 14 } },
  { nombre: "Zinc", patrones: ["zinc"], ap: { Zn: 35 } },
] as const
