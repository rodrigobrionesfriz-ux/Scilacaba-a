import { requirePermiso } from "@/server/auth/auth.queries"
import { MovimientoNuevoView } from "../(sections)/movimientos.nuevo.view"

const NuevaEntradaPage = async () => {
  await requirePermiso("movimientos.crear")
  return <MovimientoNuevoView direccion="ENT" />
}

export default NuevaEntradaPage
