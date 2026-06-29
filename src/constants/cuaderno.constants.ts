// Constantes del Cuaderno de Campo (regla 7). Hoja: no importa otras capas.
// Listas verbatim del monolito (index.html) para preservar la funcionalidad (SPEC).

export const CUADERNO_PANOS_TITLE = "Paños"
export const CUADERNO_PANOS_SUBTITLE = "Cuarteles del huerto"

export const CUADERNO_PRODUCTOS_TITLE = "Catálogo de productos"
export const CUADERNO_PRODUCTOS_SUBTITLE =
  "Productos fitosanitarios y de gestión agrícola"

export const CUADERNO_APLICACIONES_TITLE = "Aplicaciones"
export const CUADERNO_APLICACIONES_SUBTITLE =
  "Registro de aplicaciones por paño"

export const CUADERNO_ORDENES_TITLE = "Órdenes de aplicación"
export const CUADERNO_ORDENES_SUBTITLE =
  "Órdenes con distribución de agua y producto por paño"

export const CUADERNO_CONFIRMACIONES_TITLE = "Confirmaciones"
export const CUADERNO_CONFIRMACIONES_SUBTITLE =
  "Aplicaciones realizadas: agua real y cantidades aplicadas"

// Pestañas de la sub-navegación del cuaderno.
export const TABS_CUADERNO = [
  { href: "/cuaderno/panos", label: "Paños" },
  { href: "/cuaderno/productos", label: "Catálogo" },
  { href: "/cuaderno/aplicaciones", label: "Aplicaciones" },
  { href: "/cuaderno/ordenes", label: "Órdenes" },
  { href: "/cuaderno/confirmaciones", label: "Confirmaciones" },
  { href: "/cuaderno/fertirriego", label: "Fertirriego" },
] as const

// Tipos de producto (index.html:1297) — 15 opciones.
export const TIPOS_PRODUCTO = [
  "Fungicida",
  "Bactericida",
  "Insecticida",
  "Acaricida",
  "Herbicida",
  "Fertilizante foliar",
  "Fertilizante edáfico",
  "Fertilizante suelo",
  "Enmienda",
  "Fitoregulador",
  "Bioestimulante",
  "Orgánico",
  "Corrector mineral",
  "Coadyuvante",
  "Otro",
] as const

// Unidades de dosis (index.html:1308) — 9 opciones.
export const UNIDADES_DOSIS = [
  "L/ha",
  "kg/ha",
  "mL/ha",
  "g/ha",
  "cc/ha",
  "mL/100L",
  "L/100L",
  "g/100L",
  "kg/100L",
] as const

// Métodos de aplicación (index.html:1311) — 6 opciones.
export const METODOS_APLICACION = [
  "Aspersión foliar",
  "Drench",
  "Fertirriego",
  "Inyección al suelo",
  "Aspersión al suelo",
  "Pulverización",
] as const

// Paleta de colores de paños (index.html:12707).
export const COLORES_PANO = [
  "#8B1A1A",
  "#C0392B",
  "#1F618D",
  "#1E8449",
  "#76448A",
  "#B7950B",
  "#117A65",
  "#784212",
  "#943126",
  "#2471A3",
] as const

// ─── Órdenes de aplicación (OA) ───

// Tipos de aplicación de una OA (index.html:16071). Fertirriego es su propio
// módulo (OAF, Fase 6c); las OA manuales solo usan estos tres.
export const TIPOS_APP = ["Foliar", "Suelo", "Herbicida"] as const

// Estados fenológicos del cerezo (index.html:1384 / 16069) — 16 opciones.
export const ESTADOS_FENOLOGICOS = [
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

// Catálogo de objetivos de una OA (index.html:12512). Selección múltiple,
// agrupada por categoría. Verbatim del monolito.
export const OBJETIVOS_APP = [
  {
    categoria: "Enfermedades fúngicas (hongos)",
    objetivos: [
      "Pudrición parda (Monilia laxa)",
      "Cribado (Stigmina carpophila)",
      "Botrytis (Botrytis cinerea)",
      "Alternaria",
      "Antracnosis (Blumeriella jaapii)",
    ],
  },
  {
    categoria: "Enfermedades bacterianas",
    objetivos: ["Cáncer bacterial (Pseudomonas syringae)"],
  },
  {
    categoria: "Plagas (insectos)",
    objetivos: [
      "Mosca de alas manchadas (Drosophila suzukii)",
      "Mosca de la cereza (Rhagoletis cerasi)",
      "Pulgón negro del cerezo (Myzus cerasi)",
      "Polilla oriental (Cydia molesta)",
      "Chape del cerezo (Caliroa cerasi)",
      "Trips californiano (Frankliniella occidentalis)",
      "Escama de San José (Diaspidiotus perniciosus)",
      "Burrito de la vid (Naupactus xantographus)",
    ],
  },
  {
    categoria: "Ácaros",
    objetivos: [
      "Arañita roja",
      "Falsa arañita roja de la vid (Brevipalpus chilensis)",
    ],
  },
  {
    categoria: "Malezas",
    objetivos: ["Control general de malezas"],
  },
  {
    categoria: "Nutrición y fisiología",
    objetivos: [
      "Fertilización foliar",
      "Fertilización al suelo / fertirriego",
      "Bioestimulación",
      "Corrección de deficiencias nutricionales",
      "Endurecimiento de fruto / firmeza",
      "Inducción floral",
      "Mejora de cuaje",
    ],
  },
  {
    categoria: "Otros",
    objetivos: [
      "Prevención de daño por heladas",
      "Cicatrización de poda",
    ],
  },
] as const

// Unidades de dosis de una OA (index.html:1415). Las /100L requieren mojamiento.
export const UNIDADES_ORDEN = [
  "mL/100L",
  "L/100L",
  "g/100L",
  "kg/100L",
  "L/ha",
  "kg/ha",
  "mL/ha",
  "g/ha",
  "cc/ha",
] as const

// Prefijo del correlativo de OA (counters.OA), formato OA-00001 (padding a 5).
export const PREFIJO_OA = "OA"
export const OA_PADDING = 5

// Estados derivados de cobertura de una OA (index.html:16356).
export const ESTADO_ORDEN_PENDIENTE = "Pendiente"
export const ESTADO_ORDEN_PARCIAL = "Parcial"
export const ESTADO_ORDEN_COMPLETA = "Completa"
export const ESTADOS_ORDEN = [
  ESTADO_ORDEN_PENDIENTE,
  ESTADO_ORDEN_PARCIAL,
  ESTADO_ORDEN_COMPLETA,
] as const

// Turnos de una confirmación (index.html: cc-cf-turno).
export const TURNOS_CONFIRMACION = [
  "Mañana",
  "Tarde",
  "Noche",
  "Madrugada",
] as const
