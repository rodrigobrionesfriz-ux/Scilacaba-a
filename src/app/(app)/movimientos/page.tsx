import { requirePermiso } from "@/server/auth/auth.queries"
import { MovimientosView } from "./(sections)/movimientos.view"

const MovimientosPage = async () => {
  await requirePermiso("movimientos.ver")
  return <MovimientosView />
}

export default MovimientosPage
