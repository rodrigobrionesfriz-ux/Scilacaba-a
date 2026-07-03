import { requirePermiso } from "@/server/auth/auth.queries"
import { PresupuestoView } from "./(sections)/presupuesto.view"

const PresupuestoPage = async () => {
  await requirePermiso("presupuesto.ver")
  return <PresupuestoView />
}

export default PresupuestoPage
