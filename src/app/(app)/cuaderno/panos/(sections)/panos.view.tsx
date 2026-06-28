import { getUsuarioActual } from "@/server/auth/auth.queries"
import { getPanos } from "@/server/panos/panos.queries"
import { can } from "@/utils/permisos.utils"
import { PanosTable } from "./panos.table"

export const PanosView = async () => {
  const [usuario, panos] = await Promise.all([getUsuarioActual(), getPanos()])
  return (
    <PanosTable panos={panos} puedeEditar={can(usuario, "cuaderno.panos")} />
  )
}
