import { getUsuarioActual } from "@/server/auth/auth.queries"
import { getSectores } from "@/server/sectores/sectores.queries"
import { can } from "@/utils/permisos.utils"
import { SectoresTable } from "./sectores.table"

export const SectoresView = async () => {
  const [usuario, sectores] = await Promise.all([
    getUsuarioActual(),
    getSectores(),
  ])
  return (
    <SectoresTable
      sectores={sectores}
      puedeEditar={can(usuario, "cuaderno.editar")}
    />
  )
}
