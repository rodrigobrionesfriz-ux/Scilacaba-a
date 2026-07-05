import { getUsuarioActual } from "@/server/auth/auth.queries"
import { getEquipos } from "@/server/equipos/equipos.queries"
import { getOrdenes } from "@/server/ordenes/ordenes.queries"
import { getPanos } from "@/server/panos/panos.queries"
import { getProductosCuaderno } from "@/server/productos-cuaderno/productos-cuaderno.queries"
import { can } from "@/utils/permisos.utils"
import { OrdenesTable } from "./ordenes.table"

export const OrdenesView = async () => {
  const [usuario, ordenes, panos, productos, equipos] = await Promise.all([
    getUsuarioActual(),
    getOrdenes(),
    getPanos(),
    getProductosCuaderno(),
    getEquipos(),
  ])
  return (
    <OrdenesTable
      ordenes={ordenes}
      panos={panos}
      catalogo={productos.map((p) => p.nombre)}
      equipos={equipos}
      puedeEditar={can(usuario, "cuaderno.editar")}
      puedeConfirmar={can(usuario, "cuaderno.confirmar")}
    />
  )
}
