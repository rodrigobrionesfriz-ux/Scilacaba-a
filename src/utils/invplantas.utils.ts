import {
  ABREV_VARIEDADES,
  ESTADOS_PLANTA_VALUES,
  TIPOS_PLANTA,
} from "@/constants/terreno.constants"
import type {
  EstadoPlanta,
  Gps,
  PasoSecuencia,
  PlantaCapturada,
  ResumenPano,
  TipoPlanta,
} from "@/types/invplantas.types"

// Lógica pura del Inventario de huerto (regla 8). Sin I/O. Fuente de verdad
// compartida por la captura (preview en vivo), la Server Action (generación
// autoritativa de plantas al sincronizar) y el mapa/revisión.

// Quita acentos para normalizar nombres antes de codificar.
const sinTildes = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "")

const numeroONull = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null

const esTipoPlanta = (v: unknown): v is TipoPlanta =>
  typeof v === "string" && (TIPOS_PLANTA as readonly string[]).includes(v)

const esEstadoPlanta = (v: unknown): v is EstadoPlanta =>
  typeof v === "string" &&
  (ESTADOS_PLANTA_VALUES as readonly string[]).includes(v)

// Abreviatura de variedad para el código base (index.html: ipAbrevVariedad).
// Usa el mapa conocido; si no, las primeras 3 letras normalizadas en mayúscula.
export const abrevVariedad = (variedad: string): string => {
  const clave = sinTildes(variedad).toLowerCase().trim()
  return (
    ABREV_VARIEDADES[clave] ??
    sinTildes(variedad)
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 3)
  )
}

// Código base de la hilera, p. ej. "C1REGH1" (index.html:10515,
// ipGenerarCodigoBase): C<dígitos del cuartel> + abrev. variedad + H<nº hilera>.
export const generarCodigoBase = (
  cuartel: string,
  variedad: string,
  hilera: string,
): string => {
  const cu = sinTildes(cuartel).toUpperCase()
  const dig = cu.match(/(\d+)/)
  const cuCode = dig ? `C${dig[1]}` : cu.replace(/[^A-Z]/g, "").slice(0, 3)
  const hCode = `H${String(hilera).replace(/[^0-9]/g, "")}`
  return `${cuCode}${abrevVariedad(variedad)}${hCode}`
}

// Contadores derivados de la secuencia (fuente de verdad: el orden de caminata).
export const recalcularContadores = (secuencia: readonly PasoSecuencia[]) => ({
  countPrincipal: secuencia.filter((p) => p.tipo === "principal").length,
  countPoliniz: secuencia.filter((p) => p.tipo === "poliniz").length,
})

// Una hilera par se recorre al revés → la secuencia se invierte antes de numerar
// para que la planta #1 corresponda a la posición física (index.html: zigzag).
export const esHileraInvertida = (hilera: string): boolean => {
  const n = Number.parseInt(String(hilera).replace(/[^0-9]/g, ""), 10)
  return Number.isFinite(n) && n % 2 === 0
}

const interpolar = (a: number, b: number, frac: number) => a + (b - a) * frac

// Interpola lat/lng de una planta según su fracción de avance en la hilera.
const gpsEnFraccion = (
  ini: Gps | null,
  fin: Gps | null,
  frac: number,
): { lat: number | null; lng: number | null } => {
  if (ini && fin)
    return {
      lat: interpolar(ini.lat, fin.lat, frac),
      lng: interpolar(ini.lng, fin.lng, frac),
    }
  if (ini) return { lat: ini.lat, lng: ini.lng }
  return { lat: null, lng: null }
}

const codigoPlanta = (codigoBase: string, seq: number) =>
  `${codigoBase}-${String(seq).padStart(6, "0")}`

// Genera las plantas individuales desde la secuencia de caminata
// (index.html:10770, ipGenerarPlantas): aplica zigzag (hilera par → invertir),
// numera 1..N, codifica y reparte el GPS interpolado entre los extremos.
export const generarPlantas = (params: {
  secuencia: readonly PasoSecuencia[]
  hilera: string
  codigoBase: string
  gpsInicio: Gps | null
  gpsFin: Gps | null
}): PlantaCapturada[] => {
  const seq = [...params.secuencia]
  if (esHileraInvertida(params.hilera)) seq.reverse()
  const total = seq.length
  return seq.map((paso, i) => {
    const frac = total > 1 ? i / (total - 1) : 0
    const { lat, lng } = gpsEnFraccion(params.gpsInicio, params.gpsFin, frac)
    return {
      seq: i + 1,
      codigo: codigoPlanta(params.codigoBase, i + 1),
      tipo: paso.tipo,
      estado: paso.estado,
      lat,
      lng,
    }
  })
}

// Tras insertar/eliminar una planta en el mapa (index.html:11587/11661): el
// array ya está en orden físico → renumera, recodifica y reinterpola el GPS de
// toda la hilera. No reaplica el zigzag (las plantas ya están ordenadas).
export const renumerarRecodificar = (
  plantas: readonly PlantaCapturada[],
  codigoBase: string,
  gpsInicio: Gps | null,
  gpsFin: Gps | null,
): PlantaCapturada[] => {
  const total = plantas.length
  return plantas.map((p, i) => {
    const frac = total > 1 ? i / (total - 1) : 0
    const { lat, lng } = gpsEnFraccion(gpsInicio, gpsFin, frac)
    return { ...p, seq: i + 1, codigo: codigoPlanta(codigoBase, i + 1), lat, lng }
  })
}

// Narrowing de un punto GPS crudo (blob jsonb) sin `as`.
export const narrowGps = (blob: unknown): Gps | null => {
  if (typeof blob !== "object" || blob === null) return null
  const o: Record<string, unknown> = { ...blob }
  if (typeof o.lat !== "number" || typeof o.lng !== "number") return null
  return {
    lat: o.lat,
    lng: o.lng,
    precision: numeroONull(o.precision),
    hora: typeof o.hora === "string" ? o.hora : null,
  }
}

// Narrowing de una planta cruda (blob jsonb del origen, heterogéneo) sin `as`.
// Tolera registros legacy: tipo/estado fuera de rango caen a principal/sano.
export const narrowPlanta = (
  blob: unknown,
  indice: number,
): PlantaCapturada | null => {
  if (typeof blob !== "object" || blob === null) return null
  const o: Record<string, unknown> = { ...blob }
  return {
    seq: typeof o.seq === "number" ? o.seq : indice + 1,
    codigo: typeof o.codigo === "string" ? o.codigo : "",
    tipo: esTipoPlanta(o.tipo) ? o.tipo : "principal",
    estado: esEstadoPlanta(o.estado) ? o.estado : "sano",
    lat: numeroONull(o.lat),
    lng: numeroONull(o.lng),
  }
}

// Lee y narrowea un blob `plantas[]` jsonb, descartando entradas no-objeto.
export const narrowPlantas = (blob: unknown): PlantaCapturada[] => {
  if (!Array.isArray(blob)) return []
  return blob.flatMap((item, i) => {
    const p = narrowPlanta(item, i)
    return p ? [p] : []
  })
}

// Conteo de plantas por estado. Devuelve los 5 estados (0 si no hay).
export const desgloseEstados = (
  plantas: readonly PlantaCapturada[],
): Record<EstadoPlanta, number> => {
  const conteo: Record<EstadoPlanta, number> = {
    sano: 0,
    debil: 0,
    muerto: 0,
    replante: 0,
    falta: 0,
  }
  for (const p of plantas) conteo[p.estado] += 1
  return conteo
}

// Agrega los registros por cuartel + variedad (index.html: ipRenderResumenPanos):
// nº de hileras, total de plantas, desglose principal/poliniz y por estado.
export const resumenPorPano = (
  registros: readonly {
    cuartelId: number | null
    cuartel: string
    variedad: string
    plantas: PlantaCapturada[]
  }[],
): ResumenPano[] => {
  const mapa = new Map<string, ResumenPano>()
  for (const r of registros) {
    const clave = `${r.cuartel}||${r.variedad}`
    const acc =
      mapa.get(clave) ??
      ({
        clave,
        cuartelId: r.cuartelId,
        cuartel: r.cuartel,
        variedad: r.variedad,
        nHileras: 0,
        totalPlantas: 0,
        principal: 0,
        poliniz: 0,
        estados: { sano: 0, debil: 0, muerto: 0, replante: 0, falta: 0 },
      } satisfies ResumenPano)
    acc.nHileras += 1
    acc.totalPlantas += r.plantas.length
    acc.principal += r.plantas.filter((p) => p.tipo === "principal").length
    acc.poliniz += r.plantas.filter((p) => p.tipo === "poliniz").length
    for (const p of r.plantas) acc.estados[p.estado] += 1
    mapa.set(clave, acc)
  }
  return [...mapa.values()]
}

// Etiqueta corta de GPS para la UI. "—" si no hay coordenadas.
export const formatGps = (lat: number | null, lng: number | null) =>
  lat === null || lng === null ? "—" : `${lat.toFixed(5)}, ${lng.toFixed(5)}`
