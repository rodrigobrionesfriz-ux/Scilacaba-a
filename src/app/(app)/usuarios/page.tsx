import { requirePermiso } from "@/server/auth/auth.queries"
import { UsuariosView } from "./(sections)/usuarios.view"

const UsuariosPage = async () => {
  await requirePermiso("usuarios.ver")
  return <UsuariosView />
}

export default UsuariosPage
