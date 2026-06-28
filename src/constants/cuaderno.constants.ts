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

// Pestañas de la sub-navegación del cuaderno.
export const TABS_CUADERNO = [
  { href: "/cuaderno/panos", label: "Paños" },
  { href: "/cuaderno/productos", label: "Catálogo" },
  { href: "/cuaderno/aplicaciones", label: "Aplicaciones" },
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
