import { TEMPORADA_HISTORICA } from "@/constants/config.constants"
import type {
  Empresa,
  IndicadoresMes,
  IndicadoresRoot,
} from "@/types/config.types"

const esRegistro = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

const aTexto = (v: unknown): string => (typeof v === "string" ? v : "")
const aBool = (v: unknown): boolean => v === true
const aNumeroOpt = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined

// Narrowea el blob config.empresa → Empresa (regla 11, sin as). Campos ausentes
// → "" / false. No usa el schema (que exige nombre no vacío) porque la lectura
// debe tolerar una empresa aún no configurada.
export const narrowEmpresa = (valor: unknown): Empresa => {
  const o = esRegistro(valor) ? valor : {}
  return {
    nombre: aTexto(o.nombre),
    rut: aTexto(o.rut),
    direccion: aTexto(o.direccion),
    giro: aTexto(o.giro),
    telefono: aTexto(o.telefono),
    correo: aTexto(o.correo),
    logo: aTexto(o.logo),
    recupIEC: aBool(o.recupIEC),
  }
}

const narrowMes = (v: unknown): IndicadoresMes => {
  const o = esRegistro(v) ? v : {}
  const mes: IndicadoresMes = {}
  const usd = aNumeroOpt(o.usd)
  const utm = aNumeroOpt(o.utm)
  const uf = aNumeroOpt(o.uf)
  if (usd !== undefined) mes.usd = usd
  if (utm !== undefined) mes.utm = utm
  if (uf !== undefined) mes.uf = uf
  return mes
}

const narrowMeses = (v: unknown): Record<string, IndicadoresMes> => {
  const dst: Record<string, IndicadoresMes> = {}
  if (esRegistro(v)) {
    for (const [mes, val] of Object.entries(v)) dst[mes] = narrowMes(val)
  }
  return dst
}

// Narrowea el blob config.indicadoresDiarios → IndicadoresRoot. Incluye la
// migración de la estructura antigua { meses } → temporada histórica
// (index.html:9204).
export const narrowIndicadoresRoot = (valor: unknown): IndicadoresRoot => {
  if (!esRegistro(valor)) return { temporadas: {} }
  const temporadas: Record<string, Record<string, IndicadoresMes>> = {}
  const raw = esRegistro(valor.temporadas) ? valor.temporadas : {}
  for (const [temp, meses] of Object.entries(raw)) {
    temporadas[temp] = narrowMeses(meses)
  }
  if (esRegistro(valor.meses) && !temporadas[TEMPORADA_HISTORICA]) {
    temporadas[TEMPORADA_HISTORICA] = narrowMeses(valor.meses)
  }
  return { temporadas }
}

// Normaliza el textarea de subgrupos: trim, mayúsculas, sin vacíos ni duplicados
// (index.html:9608).
export const normalizarSubgrupos = (raw: string): string[] => {
  const items = raw
    .split("\n")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
  return [...new Set(items)]
}
