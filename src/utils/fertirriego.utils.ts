// Utilidades puras de Fertirriego (regla 8). Espejo del monolito (index.html):
// dosisAKg + cálculo de aporte (L14224-14240), frBuscarAporteBase/_frNorm
// (L13685-13704). Sin acceso a datos: la Server Action, las vistas y el form
// comparten estas funciones como única fuente de verdad.

import {
  FERTILIZANTES_BASE,
  FR_NUTRIENTES,
  CONDICIONES_FERT_DEFAULT,
  DOCUMENTO_FERT_DEFAULT,
  EMPRESA_FERT_DEFAULT,
  EQUIPOS_FERT_DEFAULT,
  ESTADOS_FERT_DEFAULT,
  FORMAS_FERT_DEFAULT,
  HORARIOS_FERT_DEFAULT,
  RANGOS_FERT_DEFAULT,
  TEMPORADA_FERT_DEFAULT,
  TIPOS_DOC_FERT_DEFAULT,
  UNIDADES_FERT_DEFAULT,
} from "@/constants/fertirriego.constants"
import type {
  Aportes,
  AporteTotal,
  ConfigFert,
  LineaOaf,
  Nutriente,
  PredioFert,
  RangoFert,
} from "@/types/fertirriego.types"

// Convierte la dosis a kg de producto según la unidad (verbatim L14224). C.C/mL
// se asumen ~1 g/mL y L ~1 kg/L (conversión aproximada del monolito).
export const dosisAKg = (dosis: number, unidad: string): number => {
  const d = Number(dosis) || 0
  const u = (unidad || "").toUpperCase().trim()
  if (["GRS.", "GR", "G", "GRS", "G/HA", "GRS/HA"].includes(u)) return d / 1000
  if (["C.C", "CC", "ML", "MML", "ML/HA"].includes(u)) return d / 1000
  if (["KG", "KG/HA", "K"].includes(u)) return d
  if (["L", "LT", "L/HA"].includes(u)) return d
  return d
}

// Hectáreas totales de los sectores seleccionados (suma de `ha`).
export const haTotalSectores = (
  sectores: ReadonlyArray<{ ha: number | null }>,
): number => sectores.reduce((acc, s) => acc + (s.ha ?? 0), 0)

// Aporte nutricional total estimado de una OAF: por cada línea, kg de producto =
// dosisAKg × há total; por nutriente, total += kg × (%/100). Devuelve solo los
// nutrientes con aporte > 0 (espejo del cálculo de frVerOrden, L14233-14240).
export const calcularAportes = (
  lineas: ReadonlyArray<LineaOaf>,
  aportesPorProducto: ReadonlyMap<string, Aportes>,
  haTotal: number,
): AporteTotal[] => {
  const total = new Map<Nutriente, number>()
  for (const nu of FR_NUTRIENTES) total.set(nu, 0)
  for (const linea of lineas) {
    const aportes = aportesPorProducto.get(linea.prod)
    if (!aportes) continue
    const kgProd = dosisAKg(linea.dosis, linea.unidad) * haTotal
    for (const nu of FR_NUTRIENTES) {
      const pct = Number(aportes[nu]) || 0
      if (pct > 0) total.set(nu, (total.get(nu) ?? 0) + kgProd * (pct / 100))
    }
  }
  return FR_NUTRIENTES.filter((nu) => (total.get(nu) ?? 0) > 0).map((nu) => ({
    nutriente: nu,
    kg: total.get(nu) ?? 0,
  }))
}

// Normaliza texto: minúsculas, sin tildes (verbatim _frNorm L13685).
export const frNorm = (s: string): string =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()

// Busca la composición conocida por nombre comercial: gana la coincidencia con
// MÁS patrones cumplidos (la más específica). Espejo de frBuscarAporteBase L13692.
export const buscarAporteBase = (
  nombreComercial: string,
): { ap: Aportes; nombreBase: string } | null => {
  const n = frNorm(nombreComercial)
  if (!n) return null
  let mejor: (typeof FERTILIZANTES_BASE)[number] | null = null
  let mejorScore = 0
  for (const item of FERTILIZANTES_BASE) {
    const todos = item.patrones.every((pat) => n.indexOf(frNorm(pat)) >= 0)
    if (todos && item.patrones.length > mejorScore) {
      mejor = item
      mejorScore = item.patrones.length
    }
  }
  return mejor ? { ap: { ...mejor.ap }, nombreBase: mejor.nombre } : null
}

// ─── Narrowing de blobs jsonb sin `as` (regla 11) ───

const esRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

const aNumero = (v: unknown): number => (typeof v === "number" ? v : Number(v) || 0)

const aTexto = (v: unknown): string =>
  typeof v === "string" ? v : v == null ? "" : String(v)

const aListaStr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(aTexto).filter((s) => s.length > 0) : []

// Líneas de productos de una OAF (blob fertirriego_ordenes.lineas[]).
export const aLineas = (blob: unknown): LineaOaf[] => {
  if (!Array.isArray(blob)) return []
  return blob.map((v) => {
    const r = esRecord(v) ? v : {}
    return {
      prod: aTexto(r.prod),
      dosis: aNumero(r.dosis),
      unidad: aTexto(r.unidad),
      obs: aTexto(r.obs),
    }
  })
}

// Composición nutricional de un producto (blob field_products.aportes).
export const aAportes = (blob: unknown): Aportes => {
  const r = esRecord(blob) ? blob : {}
  const out: Aportes = {}
  for (const nu of FR_NUTRIENTES) {
    const val = Number(r[nu])
    if (Number.isFinite(val) && val > 0) out[nu] = val
  }
  return out
}

const aRangos = (v: unknown): RangoFert[] => {
  if (!Array.isArray(v)) return []
  return v.map((x) => {
    const r = esRecord(x) ? x : {}
    return {
      especie: aTexto(r.especie),
      desde: aNumero(r.desde),
      hasta: aNumero(r.hasta),
    }
  })
}

const aPredios = (v: unknown): PredioFert[] => {
  if (!Array.isArray(v)) return []
  return v.map((x) => {
    const r = esRecord(x) ? x : {}
    return { predio: aTexto(r.predio), admin: aTexto(r.admin) }
  })
}

const conFallback = (v: unknown, fallback: readonly string[]): string[] => {
  const lista = aListaStr(v)
  return lista.length > 0 ? lista : [...fallback]
}

// Configuración singleton fusionada con los defaults del monolito (blob cfg).
export const aConfigFert = (blob: unknown): ConfigFert => {
  const c = esRecord(blob) ? blob : {}
  return {
    empresa: aTexto(c.empresa) || EMPRESA_FERT_DEFAULT,
    temporada: aTexto(c.temporada) || TEMPORADA_FERT_DEFAULT,
    documento: aTexto(c.documento) || DOCUMENTO_FERT_DEFAULT,
    obsDefecto: aTexto(c.obsDefecto),
    rangos: aRangos(c.rangos).length > 0 ? aRangos(c.rangos) : [...RANGOS_FERT_DEFAULT],
    estados: conFallback(c.estados, ESTADOS_FERT_DEFAULT),
    condiciones: conFallback(c.condiciones, CONDICIONES_FERT_DEFAULT),
    equipos: conFallback(c.equipos, EQUIPOS_FERT_DEFAULT),
    formas: conFallback(c.formas, FORMAS_FERT_DEFAULT),
    unidades: conFallback(c.unidades, UNIDADES_FERT_DEFAULT),
    horarios: conFallback(c.horarios, HORARIOS_FERT_DEFAULT),
    tiposDoc: conFallback(c.tiposDoc, TIPOS_DOC_FERT_DEFAULT),
    predios: aPredios(c.predios),
  }
}
