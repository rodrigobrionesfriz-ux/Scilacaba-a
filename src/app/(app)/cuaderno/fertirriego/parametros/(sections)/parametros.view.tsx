import { getUsuarioActual } from "@/server/auth/auth.queries"
import { getConfigFert } from "@/server/fertirriego-config/fertirriego-config.queries"
import { can } from "@/utils/permisos.utils"
import { ParametrosForm } from "./parametros.form"

export const ParametrosView = async () => {
  const [usuario, config] = await Promise.all([
    getUsuarioActual(),
    getConfigFert(),
  ])
  return (
    <ParametrosForm
      config={config}
      puedeEditar={can(usuario, "cuaderno.editar")}
    />
  )
}
