import { getUsuarioActual } from "@/server/auth/auth.queries"
import { getUsuarios } from "@/server/usuarios/usuarios.queries"
import { can } from "@/utils/permisos.utils"
import { UsuarioForm } from "./usuarios.form"
import { UsuariosTable } from "./usuarios.table"

export const UsuariosView = async () => {
  const [usuario, usuarios] = await Promise.all([
    getUsuarioActual(),
    getUsuarios(),
  ])
  const puedeEditar = can(usuario, "usuarios.crear")

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestión de usuarios, roles y permisos.
          </p>
        </div>
        {puedeEditar && <UsuarioForm />}
      </header>
      <UsuariosTable usuarios={usuarios} puedeEditar={puedeEditar} />
    </div>
  )
}
