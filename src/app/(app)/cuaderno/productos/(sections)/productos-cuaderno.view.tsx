import { getUsuarioActual } from "@/server/auth/auth.queries"
import { getProductosCuaderno } from "@/server/productos-cuaderno/productos-cuaderno.queries"
import { can } from "@/utils/permisos.utils"
import { ProductosCuadernoTable } from "./productos-cuaderno.table"

export const ProductosCuadernoView = async () => {
  const [usuario, productos] = await Promise.all([
    getUsuarioActual(),
    getProductosCuaderno(),
  ])
  return (
    <ProductosCuadernoTable
      productos={productos}
      puedeEditar={can(usuario, "cuaderno.editar")}
    />
  )
}
