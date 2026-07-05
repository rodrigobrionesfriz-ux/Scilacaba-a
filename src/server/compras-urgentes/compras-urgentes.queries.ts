import { asc } from "drizzle-orm"
import { db } from "@/db/client"
import { applicationOrders, products } from "@/db/schema"
import { getStockResumenPorProducto } from "@/server/stock/stock.queries"
import type { CompraUrgente } from "@/types/compras-urgentes.types"
import {
  construirComprasUrgentes,
  normalizarNombreProducto,
  type OrdenParaCU,
} from "@/utils/compras-urgentes.utils"
import { aProductosOrden } from "@/utils/ordenes.utils"

// Lista de Compra Urgente calculada EN VIVO: órdenes vigentes vs stock actual.
export const getComprasUrgentes = async (): Promise<CompraUrgente[]> => {
  const [ordenesRows, prods, stockResumen] = await Promise.all([
    db
      .select({
        id: applicationOrders.id,
        numero: applicationOrders.numero,
        fecha: applicationOrders.fecha,
        productos: applicationOrders.productos,
      })
      .from(applicationOrders)
      .orderBy(asc(applicationOrders.fecha)),
    db.select({ codigoInterno: products.codigoInterno, descripcion: products.descripcion }).from(products),
    getStockResumenPorProducto(),
  ])

  const codigoPorNombre = new Map(
    prods.map((p) => [normalizarNombreProducto(p.descripcion), p.codigoInterno]),
  )
  const stockPorCodigo = new Map(stockResumen.map((s) => [s.codigoInterno, s.cantidad]))

  const ordenes: OrdenParaCU[] = ordenesRows.map((o) => ({
    id: o.id,
    numero: o.numero,
    fecha: o.fecha ?? "",
    productos: aProductosOrden(o.productos).map((p) => ({
      nombre: p.nombre,
      unidad: p.unidad,
      tProd: p.tProd,
    })),
  }))

  return construirComprasUrgentes(ordenes, codigoPorNombre, stockPorCodigo)
}
