import { TIPOS_ARBOL } from "@/constants/terreno.constants"
import type { ArbolCapturado, TipoArbol } from "@/types/conteos.types"

// Lógica pura del módulo de Conteos (regla 8). Sin I/O. Fuente de verdad
// compartida por la captura (preview en vivo) y la Server Action (cálculo
// autoritativo al sincronizar) y la vista de revisión.

// Promedio de centros florales de los árboles contados. 0 si no hay árboles.
export const promedioCentros = (arboles: readonly { centros: number }[]) => {
  if (arboles.length === 0) return 0
  const total = arboles.reduce((acc, a) => acc + a.centros, 0)
  return total / arboles.length
}

const esTipoArbol = (v: unknown): v is TipoArbol =>
  typeof v === "string" && (TIPOS_ARBOL as readonly string[]).includes(v)

const numeroONull = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null

// Narrowing de un árbol crudo (blob jsonb del origen) sin `as`. Devuelve null si
// el objeto no tiene la forma mínima esperada (la data offline es heterogénea).
export const narrowArbol = (blob: unknown): ArbolCapturado | null => {
  if (typeof blob !== "object" || blob === null) return null
  const o: Record<string, unknown> = { ...blob }
  if (typeof o.n !== "number" || typeof o.centros !== "number") return null
  if (!esTipoArbol(o.tipo)) return null
  if (typeof o.codigo !== "string") return null
  return {
    n: o.n,
    centros: o.centros,
    tipo: o.tipo,
    codigo: o.codigo,
    lat: numeroONull(o.lat),
    lng: numeroONull(o.lng),
    precision: numeroONull(o.precision),
    fecha: typeof o.fecha === "string" ? o.fecha : "",
  }
}

// Lee y narrowea un blob `arboles[]` jsonb, descartando entradas malformadas.
export const narrowArboles = (blob: unknown): ArbolCapturado[] => {
  if (!Array.isArray(blob)) return []
  return blob.flatMap((item) => {
    const arbol = narrowArbol(item)
    return arbol ? [arbol] : []
  })
}

// Resumen de una sesión de conteo: total y desglose fijos/aleatorios.
export const resumenConteo = (arboles: readonly ArbolCapturado[]) => ({
  total: arboles.length,
  fijos: arboles.filter((a) => a.tipo === "fijo").length,
  aleatorios: arboles.filter((a) => a.tipo === "aleatorio").length,
  promedio: promedioCentros(arboles),
})

// Etiqueta corta de GPS para mostrar en la UI. "—" si no hay coordenadas.
export const formatGps = (lat: number | null, lng: number | null) =>
  lat === null || lng === null ? "—" : `${lat.toFixed(5)}, ${lng.toFixed(5)}`
