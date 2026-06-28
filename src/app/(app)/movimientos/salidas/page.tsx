import { requirePermiso } from "@/server/auth/auth.queries"
import { MovimientoNuevoView } from "../(sections)/movimientos.nuevo.view"

const NuevaSalidaPage = async () => {
  await requirePermiso("movimientos.crear")
  return <MovimientoNuevoView direccion="SAL" />
}

export default NuevaSalidaPage
