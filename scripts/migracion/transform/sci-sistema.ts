import { audit, config, counters } from "@/db/schema"
import type { CuadernoPayload } from "@/schemas/firestore-cuaderno.schema"
import type { SciPayload } from "@/schemas/firestore-sci.schema"
import { parseTimestamp, toIntOrNull } from "@/utils/migracion.utils"

export type FilasSistema = {
  audit: (typeof audit.$inferInsert)[]
  config: (typeof config.$inferInsert)[]
}

// Claves de config que NO van a la tabla config (se mueven a counters).
const CLAVES_COUNTER = new Set(["counters", "productCounter"])

const findConfig = (
  p: SciPayload,
  clave: string,
): Record<string, unknown> | undefined =>
  (p.config ?? []).find((e) => e.key === clave)

// audit + config (jsonb). counters/productCounter se excluyen de config → buildCounters.
export const transformSistema = (p: SciPayload): FilasSistema => {
  const auditRows: FilasSistema["audit"] = (p.audit ?? []).map((a) => ({
    id: a.id,
    fecha: parseTimestamp(a.fecha) ?? new Date(0),
    usuario: a.usuario ?? null,
    accion: a.accion ?? null,
    detalle: a.detalle ?? null,
    referencia: a.referencia ?? null,
  }))

  const configRows: FilasSistema["config"] = (p.config ?? [])
    .filter((e) => !CLAVES_COUNTER.has(e.key))
    .map((e) => {
      const { key, ...rest } = e
      return { clave: key, valor: rest }
    })

  return { audit: auditRows, config: configRows }
}

// Correlativos: numero = PREFIX-NNNNNN. Devuelve el mayor sufijo por prefijo.
const maxSufijoPorPrefijo = (numeros: (string | null | undefined)[]) => {
  const max = new Map<string, number>()
  for (const numero of numeros) {
    const m = numero?.match(/^([A-Za-z]+)-(\d+)$/)
    if (!m) continue
    const prefijo = m[1].toUpperCase()
    const n = Number(m[2])
    if (!Number.isFinite(n)) continue
    max.set(prefijo, Math.max(max.get(prefijo) ?? 0, n))
  }
  return max
}

// Siembra counters desde config (entry "counters" + "productCounter"),
// cuaderno.oCounter ("OA") y fertirriego.oCounter ("OAF"); luego reajusta cada
// clave al máximo correlativo realmente usado (movements + inventoryCounts).
// SERV-* y OT-* no tienen counter en el origen → quedan exentos.
export const buildCounters = (
  p: SciPayload,
  cuaderno: CuadernoPayload,
): (typeof counters.$inferInsert)[] => {
  const valores = new Map<string, number>()

  const countersEntry = findConfig(p, "counters")
  if (countersEntry) {
    for (const [k, v] of Object.entries(countersEntry)) {
      if (k === "key") continue
      const n = toIntOrNull(v)
      if (n != null) valores.set(k.toUpperCase(), n)
    }
  }

  const productCounter = findConfig(p, "productCounter")
  const productValor = toIntOrNull(productCounter?.value)
  if (productValor != null) valores.set("PRODUCTO", productValor)

  const oa = toIntOrNull(cuaderno.oCounter)
  if (oa != null) valores.set("OA", oa)
  const oaf = toIntOrNull(cuaderno.fertirriego?.oCounter)
  if (oaf != null) valores.set("OAF", oaf)

  // Reajuste al máximo realmente usado (correlativos sin huecos).
  const usados = maxSufijoPorPrefijo([
    ...(p.movements ?? []).map((m) => m.numero),
    ...(p.inventoryCounts ?? []).map((c) => c.numero),
  ])
  for (const [prefijo, max] of usados) {
    if (valores.has(prefijo)) {
      valores.set(prefijo, Math.max(valores.get(prefijo) ?? 0, max))
    }
  }

  return [...valores].map(([clave, valor]) => ({ clave, valor }))
}
