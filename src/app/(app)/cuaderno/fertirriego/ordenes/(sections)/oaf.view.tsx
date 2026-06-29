import { getUsuarioActual } from "@/server/auth/auth.queries"
import { getConfigFert } from "@/server/fertirriego-config/fertirriego-config.queries"
import {
  getOrdenesFert,
  getProductosFertirriego,
} from "@/server/oaf/oaf.queries"
import { getSectores } from "@/server/sectores/sectores.queries"
import { can } from "@/utils/permisos.utils"
import { OafTable } from "./oaf.table"

export const OafView = async () => {
  const [usuario, ordenes, sectores, productos, config] = await Promise.all([
    getUsuarioActual(),
    getOrdenesFert(),
    getSectores(),
    getProductosFertirriego(),
    getConfigFert(),
  ])
  return (
    <OafTable
      ordenes={ordenes}
      sectores={sectores}
      productos={productos}
      config={config}
      puedeEditar={can(usuario, "cuaderno.editar")}
      puedeConfirmar={can(usuario, "cuaderno.confirmar")}
    />
  )
}
