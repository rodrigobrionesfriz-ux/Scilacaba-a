import { requirePermiso } from "@/server/auth/auth.queries"
import {
  getDatosEstimacion,
  getEstimaciones,
} from "@/server/estimaciones/estimaciones.queries"
import { EstimacionCalculator } from "./estimacion.calculator"
import { EstimacionTable } from "./estimacion.table"

// Módulo online (no offline como Conteos/Invplantas): lee datos ya
// sincronizados y calcula/guarda versiones vía Server Actions.
export const EstimacionView = async () => {
  await requirePermiso("conteos.revisar")
  const [base, versiones] = await Promise.all([
    getDatosEstimacion(),
    getEstimaciones(),
  ])
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Calculadora</h2>
        <EstimacionCalculator base={base} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Versiones guardadas</h2>
        <EstimacionTable versiones={versiones} />
      </section>
    </div>
  )
}
