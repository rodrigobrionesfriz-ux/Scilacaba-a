import { getUsuarioActual } from "@/server/auth/auth.queries"
import { getProductosFertirriego } from "@/server/oaf/oaf.queries"
import { can } from "@/utils/permisos.utils"
import { AportesTable } from "./aportes.table"

export const AportesView = async () => {
  const [usuario, productos] = await Promise.all([
    getUsuarioActual(),
    getProductosFertirriego(),
  ])
  return (
    <AportesTable
      productos={productos}
      puedeEditar={can(usuario, "cuaderno.editar")}
    />
  )
}
