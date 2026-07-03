import { requirePermiso } from "@/server/auth/auth.queries"
import { MantencionesView } from "./(sections)/mantenciones.view"

const MantencionesPage = async () => {
  await requirePermiso("mantenciones.ver")
  return <MantencionesView />
}

export default MantencionesPage
