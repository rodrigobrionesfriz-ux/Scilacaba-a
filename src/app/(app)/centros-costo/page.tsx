import { requirePermiso } from "@/server/auth/auth.queries"
import { CentrosCostoView } from "./(sections)/centros-costo.view"

const CentrosCostoPage = async () => {
  await requirePermiso("centrosCosto.ver")
  return <CentrosCostoView />
}

export default CentrosCostoPage
