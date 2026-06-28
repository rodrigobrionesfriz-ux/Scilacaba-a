import {
  PRODUCTOS_SUBTITLE,
  PRODUCTOS_TITLE,
} from "@/constants/productos.constants"
import { getUsuarioActual } from "@/server/auth/auth.queries"
import { getGroups, getProductTypes } from "@/server/catalogos/catalogos.queries"
import { getProductos } from "@/server/productos/productos.queries"
import { getStockResumenPorProducto } from "@/server/stock/stock.queries"
import { can } from "@/utils/permisos.utils"
import { ProductosTable } from "./productos.table"

export const ProductosView = async () => {
  const [usuario, productos, tipos, grupos, resumen] = await Promise.all([
    getUsuarioActual(),
    getProductos(),
    getProductTypes(),
    getGroups(),
    getStockResumenPorProducto(),
  ])
  const stockPorProducto = new Map(resumen.map((r) => [r.codigoInterno, r]))

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">{PRODUCTOS_TITLE}</h1>
        <p className="text-muted-foreground">{PRODUCTOS_SUBTITLE}</p>
      </header>
      <ProductosTable
        productos={productos}
        tipos={tipos}
        grupos={grupos}
        stockPorProducto={stockPorProducto}
        puedeCrear={can(usuario, "productos.crear")}
        puedeEliminar={can(usuario, "productos.eliminar")}
      />
    </div>
  )
}
