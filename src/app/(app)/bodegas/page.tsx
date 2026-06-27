import { requirePermiso } from "@/server/auth/auth.queries"
import { BodegasView } from "./(sections)/bodegas.view"

const BodegasPage = async () => {
  await requirePermiso("bodegas.ver")
  return <BodegasView />
}

export default BodegasPage
