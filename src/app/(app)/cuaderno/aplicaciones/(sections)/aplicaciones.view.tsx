import { getAplicaciones } from "@/server/aplicaciones/aplicaciones.queries"
import { getUsuarioActual } from "@/server/auth/auth.queries"
import { getPanos } from "@/server/panos/panos.queries"
import { getProductosCuaderno } from "@/server/productos-cuaderno/productos-cuaderno.queries"
import { can } from "@/utils/permisos.utils"
import { AplicacionesTable } from "./aplicaciones.table"

export const AplicacionesView = async () => {
  const [usuario, aplicaciones, panos, productos] = await Promise.all([
    getUsuarioActual(),
    getAplicaciones(),
    getPanos(),
    getProductosCuaderno(),
  ])
  return (
    <AplicacionesTable
      aplicaciones={aplicaciones}
      panos={panos.map((p) => ({ value: String(p.id), label: p.nombre }))}
      productos={productos.map((p) => p.nombre)}
      puedeEditar={can(usuario, "cuaderno.editar")}
    />
  )
}
