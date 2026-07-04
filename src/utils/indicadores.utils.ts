import { PZ_MESES_TEMP, TEMPORADA_HISTORICA } from "@/constants/config.constants"
import type {
  IndicadorFila,
  IndicadoresMes,
  IndicadoresRoot,
} from "@/types/config.types"

// Código de temporada ('AAAA-BBBB') de una fecha. Mayo–Dic → año actual;
// Ene–Abr → año-1 (index.html:9195).
export const temporadaActual = (hoy: Date = new Date()): string => {
  const m = hoy.getMonth()
  const y = hoy.getFullYear()
  const inicio = m >= 4 ? y : y - 1
  return `${inicio}-${inicio + 1}`
}

// Parsea un número en formato CL ("1.234,5" → 1234.5). null si vacío / no
// numérico (index.html:9299 _parseIndic).
export const parseIndicador = (str: unknown): number | null => {
  if (str == null) return null
  const v = String(str)
    .trim()
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.\-]/g, "")
  if (v === "") return null
  const n = Number.parseFloat(v)
  return Number.isNaN(n) ? null : n
}

// Lista ordenada de temporadas: las guardadas + la actual + una hacia adelante +
// la histórica (index.html:9223).
export const listarTemporadas = (
  root: IndicadoresRoot,
  hoy: Date = new Date(),
): string[] => {
  const set = new Set<string>(Object.keys(root.temporadas))
  const actual = temporadaActual(hoy)
  set.add(actual)
  const inicioAct = Number.parseInt(actual.split("-")[0], 10)
  set.add(`${inicioAct + 1}-${inicioAct + 2}`)
  set.add(TEMPORADA_HISTORICA)
  return [...set].sort()
}

// Meses de una temporada ({} si no existe).
export const mesesDeTemporada = (
  root: IndicadoresRoot,
  temp: string,
): Record<string, IndicadoresMes> => root.temporadas[temp] ?? {}

// Año calendario de un mes dentro de una temporada (ENE..ABR caen en el año
// siguiente; index.html:9254).
export const anioDeMesEnTemporada = (mes: string, temp: string): number => {
  const inicio = Number.parseInt(temp.split("-")[0], 10)
  const idx = PZ_MESES_TEMP.findIndex((m) => m === mes.toUpperCase())
  return idx >= 8 ? inicio + 1 : inicio
}

// Construye el objeto meses de una temporada a partir de las filas editadas,
// omitiendo los valores nulos (paridad con saveIndicadores, index.html:9314).
export const construirMeses = (
  filas: IndicadorFila[],
): Record<string, IndicadoresMes> => {
  const meses: Record<string, IndicadoresMes> = {}
  for (const f of filas) {
    const mes: IndicadoresMes = {}
    if (f.usd !== null) mes.usd = f.usd
    if (f.utm !== null) mes.utm = f.utm
    if (f.uf !== null) mes.uf = f.uf
    meses[f.mes] = mes
  }
  return meses
}

// Fusiona los meses de una temporada dentro del root, preservando las demás.
export const fusionarTemporada = (
  root: IndicadoresRoot,
  temp: string,
  meses: Record<string, IndicadoresMes>,
): IndicadoresRoot => ({
  temporadas: { ...root.temporadas, [temp]: meses },
})
