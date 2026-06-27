import { requirePermiso } from "@/server/auth/auth.queries"
import { ProveedoresView } from "./(sections)/proveedores.view"

const ProveedoresPage = async () => {
  await requirePermiso("proveedores.ver")
  return <ProveedoresView />
}

export default ProveedoresPage
