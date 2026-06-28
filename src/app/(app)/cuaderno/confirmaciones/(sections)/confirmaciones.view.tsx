import { getUsuarioActual } from "@/server/auth/auth.queries"
import { getConfirmaciones } from "@/server/confirmaciones/confirmaciones.queries"
import { can } from "@/utils/permisos.utils"
import { ConfirmacionesTable } from "./confirmaciones.table"

export const ConfirmacionesView = async () => {
  const [usuario, confirmaciones] = await Promise.all([
    getUsuarioActual(),
    getConfirmaciones(),
  ])
  return (
    <ConfirmacionesTable
      confirmaciones={confirmaciones}
      puedeConfirmar={can(usuario, "cuaderno.confirmar")}
    />
  )
}
