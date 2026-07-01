// Constantes de Terreno (Conteos / Inventario de huerto / Estimación de
// cosecha). Regla 7. Hoja: no importa otras capas. Listas verbatim del
// monolito (index.html) para preservar la funcionalidad (SPEC). Conteos e
// Inventario de huerto son offline (ADR-003); Estimación es online (consume
// datos ya sincronizados de ambos).

// ─── Conteos en terreno ───

export const TERRENO_CONTEOS_TITLE = "Conteos en terreno"
export const TERRENO_CONTEOS_SUBTITLE =
  "Conteo de centros florales por árbol (captura offline)"

// Especie por defecto del huerto (index.html: _cteSesion.especie).
export const ESPECIE_DEFAULT = "Cerezo"

// Tipo de árbol contado: fijos (representativos, recorridos siempre) y al azar.
export const TIPOS_ARBOL = ["fijo", "aleatorio"] as const

// Estructura del conteo (index.html:9814): primero N fijos, luego N al azar.
export const CTE_N_FIJOS = 3
export const CTE_N_ALEATORIOS = 5

// Códigos de los árboles fijos por defecto (index.html: fijosCodigos).
export const FIJOS_CODIGOS_DEFAULT = ["F1", "F2", "F3"] as const

// Etapas fenológicas del cerezo (index.html:1384 / 16069) — 16 opciones.
// Verbatim del monolito; el conteo registra la etapa al iniciar la sesión.
export const ETAPAS_FENOLOGICAS = [
  "Yema dormida",
  "Hinchazón de yema",
  "Punta verde",
  "Oreja de ratón",
  "Verde intenso",
  "Botón blanco",
  "Plena flor",
  "Caída de pétalos",
  "Cuaje",
  "Estadio I – Endurecimiento",
  "Estadio II – Crecimiento lento",
  "Estadio III – Crecimiento rápido",
  "Pinta / Viraje de color",
  "Pre-cosecha",
  "Cosecha",
  "Post-cosecha",
] as const

// ─── Inventario de huerto (invplantas) ───

export const TERRENO_INVPLANTAS_TITLE = "Inventario de Huerto"
export const TERRENO_INVPLANTAS_SUBTITLE =
  "Conteo de plantas por hilera (principal / polinizante), captura offline"

// Estados de planta (index.html:10371, IP_ESTADOS) — 5 opciones con color.
export const ESTADOS_PLANTA = [
  { value: "sano", label: "Sano", color: "#1a7e3e" },
  { value: "debil", label: "Débil", color: "#e9b30c" },
  { value: "muerto", label: "Muerto", color: "#c0392b" },
  { value: "replante", label: "Replante", color: "#0a6ed1" },
  { value: "falta", label: "Falla/vacío", color: "#999999" },
] as const

// Tupla de valores de estado (fuente para z.enum y el tipo EstadoPlanta).
export const ESTADOS_PLANTA_VALUES = [
  "sano",
  "debil",
  "muerto",
  "replante",
  "falta",
] as const

// Tipo de planta dentro de la hilera: variedad principal o polinizante
// (index.html: dos contadores independientes).
export const TIPOS_PLANTA = ["principal", "poliniz"] as const

// Portainjertos conocidos (index.html: datalist de ipRenderInicio). Verbatim.
export const PORTAINJERTOS = [
  "Colt",
  "MaxMa 14",
  "MaxMa 60",
  "Gisela 5",
  "Gisela 6",
  "Gisela 12",
  "CAB",
  "Santa Lucía",
  "Mahaleb",
  "Pontaleb",
] as const

// Variedades polinizantes conocidas (index.html: datalist). Verbatim.
export const POLINIZANTES_CONOCIDOS = [
  "Regina",
  "Skeena",
  "Lapins",
  "Kordia",
  "Bing",
  "Santina",
  "Sweetheart",
  "Rainier",
] as const

// Abreviaturas de variedad para el código base de árbol (index.html:
// ipAbrevVariedad). Si no está en el mapa → primeras 3 letras normalizadas.
export const ABREV_VARIEDADES: Record<string, string> = {
  regina: "REG",
  skeena: "SKE",
  lapins: "LAP",
  kordia: "KOR",
  bing: "BIN",
  santina: "SAN",
  sweetheart: "SWE",
  rainier: "RAI",
}

// ─── Estimación de cosecha ───

export const TERRENO_ESTIMACION_TITLE = "Estimación de Cosecha"
export const TERRENO_ESTIMACION_SUBTITLE =
  "Cálculo de kg estimados por paño a partir de conteos e inventario de huerto"

// Defaults verbatim del monolito (index.html:10171-10172): frutos por centro
// floral y kg por fruto al inicio de una nueva estimación.
export const FRUTOS_CENTRO_DEFAULT = 2
export const KG_FRUTO_DEFAULT = 0.011

// Conversiones de kg a unidades de despacho (index.html:10195/14464).
export const KG_POR_CAJA = 5
export const KG_POR_TONELADA = 1000

// Pesos de producción por estado de planta, en % (index.html: PROD_ESTADO_DEFAULT,
// ~12475). Usados para calcular "plantas productivas equivalentes" a partir del
// desglose de invplantas. Override posible por paño (panos.prodPct).
export const PESOS_ESTADO_DEFAULT: Readonly<Record<string, number>> = {
  sano: 100,
  debil: 60,
  replante: 30,
  muerto: 0,
  falta: 0,
}

// ─── Sub-navegación de Terreno ───
// Conteos (7a) + Inventario de huerto (7b) + Estimación de cosecha (7c).
export const TABS_TERRENO = [
  { href: "/terreno/conteos", label: "Conteos" },
  { href: "/terreno/invplantas", label: "Inventario de Huerto" },
  { href: "/terreno/estimacion", label: "Estimación de Cosecha" },
] as const
