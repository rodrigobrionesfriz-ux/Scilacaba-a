import { ESTADOS_PLANTA_VALUES } from "@/constants/terreno.constants"
import type { EstadoPlanta, ResumenPano } from "@/types/invplantas.types"
import type { Moneda } from "@/types/presupuesto.types"

// Formatea un monto según la moneda del dashboard (paridad con el monolito:
// CLP entero con separador de miles es-CL; USD con dos decimales).
export const fmtMoneda = (valor: number, moneda: Moneda): string =>
  moneda === "USD"
    ? `USD ${valor.toFixed(2)}`
    : `$${Math.round(valor).toLocaleString("es-CL")}`

// Formatea un porcentaje con signo (o "s/ppto" si no hay base).
export const fmtPct = (pct: number | null): string =>
  pct === null ? "s/ppto" : `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`

// Formatea un entero con separador de miles es-CL.
export const fmtNumero = (n: number): string => n.toLocaleString("es-CL")

// Suma la fila de totales del resumen de inventario de huerto (total de plantas
// y desglose por estado a lo largo de todos los cuarteles).
export const totalesResumenInvplantas = (
  resumen: readonly ResumenPano[],
): { totalPlantas: number; porEstado: Record<EstadoPlanta, number> } => {
  const porEstado: Record<EstadoPlanta, number> = {
    sano: 0,
    debil: 0,
    muerto: 0,
    replante: 0,
    falta: 0,
  }
  let totalPlantas = 0
  for (const r of resumen) {
    totalPlantas += r.totalPlantas
    for (const e of ESTADOS_PLANTA_VALUES) porEstado[e] += r.estados[e]
  }
  return { totalPlantas, porEstado }
}
