import {
  ESTADOS_PLANTA_VALUES,
  KG_POR_CAJA,
  KG_POR_TONELADA,
  PESOS_ESTADO_DEFAULT,
} from "@/constants/terreno.constants"
import type {
  LineaEstimacion,
  LineaEstimBase,
  PesosEstado,
} from "@/types/estimaciones.types"
import type { EstadoPlanta } from "@/types/invplantas.types"

// Lógica pura de Estimación de cosecha (regla 8). Sin I/O. Fuente de verdad
// compartida por el calculador (preview en vivo) y la Server Action (cálculo
// autoritativo al guardar). Fórmula del monolito (index.html: cteRenderEstimVer):
// kgPano = centros × frutos/centro × kg/fruto × nPlantas.

const numeroONull = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null

// Plantas productivas equivalentes: cada estado aporta su % de producción
// (index.html: ctePlantasProductivas). Estado sin peso definido = 100%.
export const plantasProductivas = (
  desglose: Record<EstadoPlanta, number>,
  pesos: PesosEstado,
): { equiv: number; total: number } => {
  let equiv = 0
  let total = 0
  for (const estado of ESTADOS_PLANTA_VALUES) {
    const count = desglose[estado]
    total += count
    const factor = (pesos[estado] ?? 100) / 100
    equiv += count * factor
  }
  return { equiv: Math.round(equiv * 10) / 10, total }
}

// kg estimados de un paño (index.html:10192/10255).
export const kgLinea = (
  centros: number,
  frutosCentro: number,
  kgFruto: number,
  plantasUsadas: number,
): number => centros * frutosCentro * kgFruto * plantasUsadas

// Nº de plantas a usar en el cálculo: el equivalente ponderado si el usuario
// optó por usarlo y hay dato de invplantas; si no, el conteo directo del paño.
export const plantasUsadas = (
  linea: Pick<LineaEstimBase, "usarEquiv" | "plantas" | "plantasEquiv">,
): number =>
  linea.usarEquiv && linea.plantasEquiv !== null
    ? linea.plantasEquiv
    : linea.plantas

export const totalKgLineas = (lineas: readonly { kgPano: number }[]): number =>
  lineas.reduce((acc, l) => acc + l.kgPano, 0)

export const aCajas = (kg: number): number => kg / KG_POR_CAJA
export const aToneladas = (kg: number): number => kg / KG_POR_TONELADA

// Promedio de `promedioCentros` de los conteos de un paño (index.html:
// ctePromedioCentrosPano). null si el paño no tiene conteos con dato.
export const promedioCentrosPano = (
  conteos: readonly { panoId: number | null; promedioCentros: number | null }[],
  panoId: number,
): number | null => {
  const valores = conteos
    .filter((c) => c.panoId === panoId)
    .map((c) => c.promedioCentros)
    .filter((v): v is number => v !== null)
  if (!valores.length) return null
  return valores.reduce((a, b) => a + b, 0) / valores.length
}

// Resuelve los pesos por estado: parte de los defaults y sobreescribe con las
// claves numéricas válidas de `prodPct` (override por paño, blob jsonb sin `as`).
export const resolverPesos = (
  prodPct: unknown,
  defaults: PesosEstado = PESOS_ESTADO_DEFAULT as PesosEstado,
): PesosEstado => {
  const out: PesosEstado = { ...defaults }
  if (typeof prodPct !== "object" || prodPct === null) return out
  const o: Record<string, unknown> = { ...prodPct }
  for (const estado of ESTADOS_PLANTA_VALUES) {
    const v = o[estado]
    if (typeof v === "number" && Number.isFinite(v)) out[estado] = v
  }
  return out
}

// Narrowing del desglose crudo de plantas por estado (invplantas). null si el
// blob no es un objeto (paño sin invplantas); claves inválidas caen a 0.
export const narrowDesglose = (
  blob: unknown,
): Record<EstadoPlanta, number> | null => {
  if (typeof blob !== "object" || blob === null) return null
  const o: Record<string, unknown> = { ...blob }
  const out: Record<EstadoPlanta, number> = {
    sano: 0,
    debil: 0,
    muerto: 0,
    replante: 0,
    falta: 0,
  }
  for (const estado of ESTADOS_PLANTA_VALUES) {
    const v = o[estado]
    if (typeof v === "number" && Number.isFinite(v)) out[estado] = v
  }
  return out
}

// Narrowing de una línea cruda (blob jsonb de `estimaciones.lineas[]`) sin
// `as`. Recalcula plantasUsadas/kgPano si faltan (tolera registros legacy).
export const narrowLinea = (blob: unknown): LineaEstimacion | null => {
  if (typeof blob !== "object" || blob === null) return null
  const o: Record<string, unknown> = { ...blob }
  if (typeof o.panoId !== "number") return null

  const plantasEquiv = numeroONull(o.plantasEquiv)
  const plantas = typeof o.plantas === "number" ? o.plantas : 0
  const usarEquiv = typeof o.usarEquiv === "boolean" ? o.usarEquiv : false
  const centros = typeof o.centros === "number" ? o.centros : 0
  const frutosCentro = typeof o.frutosCentro === "number" ? o.frutosCentro : 0
  const kgFruto = typeof o.kgFruto === "number" ? o.kgFruto : 0
  const usadas = plantasUsadas({ usarEquiv, plantas, plantasEquiv })

  return {
    panoId: o.panoId,
    panoNombre: typeof o.panoNombre === "string" ? o.panoNombre : "",
    variedad: typeof o.variedad === "string" ? o.variedad : "",
    centros,
    frutosCentro,
    kgFruto,
    plantas,
    desglose: narrowDesglose(o.desglose),
    plantasEquiv,
    plantasInvTotal:
      typeof o.plantasInvTotal === "number" ? o.plantasInvTotal : null,
    usarEquiv,
    pesosEstado: resolverPesos(o.pesosEstado),
    plantasUsadas: usadas,
    kgPano:
      typeof o.kgPano === "number"
        ? o.kgPano
        : kgLinea(centros, frutosCentro, kgFruto, usadas),
  }
}

// Lee y narrowea un blob `lineas[]` jsonb, descartando entradas malformadas.
export const narrowLineas = (blob: unknown): LineaEstimacion[] => {
  if (!Array.isArray(blob)) return []
  return blob.flatMap((item) => {
    const linea = narrowLinea(item)
    return linea ? [linea] : []
  })
}
