import { sciPayloadSchema } from "@/schemas/firestore-sci.schema"
import type { ResultadoPpp } from "@/types/movimientos.types"
import type { DocCrudo } from "./firebase"

export type Discrepancia = { tipo: string; detalle: string }

const TOL = 0.0001

// Prueba dura (migrator.md #3): stock recalculado == stock crudo del origen (±0.0001) por (cod|bod).
// Las diferencias son inconsistencias preexistentes del origen → se reportan, no se "arreglan".
export const validar = (
  doc: DocCrudo,
  recalc: ResultadoPpp,
): Discrepancia[] => {
  const p = sciPayloadSchema.parse(doc.payload ?? {})
  const problemas: Discrepancia[] = []

  const calcMap = new Map(
    recalc.stock.map((s) => [`${s.codigoInterno}|${s.bodegaId}`, s]),
  )
  const vistos = new Set<string>()

  for (const s of p.stock ?? []) {
    const key = `${s.codigoInterno ?? ""}|${s.bodegaId ?? ""}`
    vistos.add(key)
    const calc = calcMap.get(key)
    const origCant = Number(s.cantidad) || 0
    const origCosto = Number(s.costoPromedio) || 0
    const recCant = calc?.cantidad ?? 0
    const recCosto = calc?.costoPromedio ?? 0
    if (Math.abs(recCant - origCant) > TOL) {
      problemas.push({
        tipo: "stock-cantidad",
        detalle: `${key}: origen ${origCant} vs recalc ${recCant}`,
      })
    }
    if (Math.abs(recCosto - origCosto) > TOL) {
      problemas.push({
        tipo: "stock-costo",
        detalle: `${key}: origen ${origCosto} vs recalc ${recCosto}`,
      })
    }
  }

  for (const [key, s] of calcMap) {
    if (!vistos.has(key) && Math.abs(s.cantidad) > TOL) {
      problemas.push({
        tipo: "stock-extra",
        detalle: `${key}: recalc ${s.cantidad}, ausente en origen`,
      })
    }
  }

  return problemas
}
