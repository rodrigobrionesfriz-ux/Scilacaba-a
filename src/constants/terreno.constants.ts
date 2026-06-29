// Constantes de Terreno (Conteos / Inventario de huerto). Regla 7. Hoja: no
// importa otras capas. Listas verbatim del monolito (index.html) para preservar
// la funcionalidad (SPEC). Módulos offline (ADR-003).

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

// ─── Inventario de huerto (invplantas) — definido para 7a, UI en 7b ───

// Estados de planta (index.html:10371, IP_ESTADOS) — 5 opciones con color.
export const ESTADOS_PLANTA = [
  { value: "sano", label: "Sano", color: "#1a7e3e" },
  { value: "debil", label: "Débil", color: "#e9b30c" },
  { value: "muerto", label: "Muerto", color: "#c0392b" },
  { value: "replante", label: "Replante", color: "#0a6ed1" },
  { value: "falta", label: "Falla/vacío", color: "#999999" },
] as const

// ─── Sub-navegación de Terreno ───
// Solo Conteos en 7a; Inventario de huerto (7b) y Estimación (7c) se añaden luego.
export const TABS_TERRENO = [
  { href: "/terreno/conteos", label: "Conteos" },
] as const
