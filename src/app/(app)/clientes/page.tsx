import { requirePermiso } from "@/server/auth/auth.queries"
import { ClientesView } from "./(sections)/clientes.view"

const ClientesPage = async () => {
  await requirePermiso("clientes.ver")
  return <ClientesView />
}

export default ClientesPage
