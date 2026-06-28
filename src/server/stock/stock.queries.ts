import { asc, eq, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { products, stock, warehouses } from "@/db/schema"
import type {
  StockResumenBodega,
  StockResumenProducto,
  StockRow,
} from "@/types/stock.types"

// Stock por producto × bodega con valorización (cantidad × costo promedio).
export const getStock = async (): Promise<StockRow[]> => {
  const rows = await db
    .select({
      codigoInterno: stock.codigoInterno,
      descripcion: products.descripcion,
      unidadMedida: products.unidadMedida,
      bodegaId: stock.bodegaId,
      bodega: warehouses.nombre,
      cantidad: stock.cantidad,
      costoPromedio: stock.costoPromedio,
    })
    .from(stock)
    .leftJoin(products, eq(stock.codigoInterno, products.codigoInterno))
    .leftJoin(warehouses, eq(stock.bodegaId, warehouses.id))
    .orderBy(asc(stock.codigoInterno), asc(stock.bodegaId))

  return rows.map((r) => {
    const cantidad = Number(r.cantidad)
    const costoPromedio = Number(r.costoPromedio)
    return {
      codigoInterno: r.codigoInterno,
      descripcion: r.descripcion ?? "",
      unidadMedida: r.unidadMedida ?? "",
      bodegaId: r.bodegaId,
      bodega: r.bodega ?? "",
      cantidad,
      costoPromedio,
      valor: cantidad * costoPromedio,
    }
  })
}

// Resumen agregado por producto (1 query) para las columnas diferidas en Productos.
export const getStockResumenPorProducto = async (): Promise<
  StockResumenProducto[]
> => {
  const rows = await db
    .select({
      codigoInterno: stock.codigoInterno,
      cantidad: sql<string>`coalesce(sum(${stock.cantidad}), 0)`,
      valor: sql<string>`coalesce(sum(${stock.cantidad} * ${stock.costoPromedio}), 0)`,
    })
    .from(stock)
    .groupBy(stock.codigoInterno)

  return rows.map((r) => ({
    codigoInterno: r.codigoInterno,
    cantidad: Number(r.cantidad),
    valor: Number(r.valor),
  }))
}

// Resumen agregado por bodega (1 query) para las columnas diferidas en Bodegas.
export const getStockResumenPorBodega = async (): Promise<
  StockResumenBodega[]
> => {
  const rows = await db
    .select({
      bodegaId: stock.bodegaId,
      items: sql<number>`count(distinct ${stock.codigoInterno})::int`,
      valor: sql<string>`coalesce(sum(${stock.cantidad} * ${stock.costoPromedio}), 0)`,
    })
    .from(stock)
    .groupBy(stock.bodegaId)

  return rows.map((r) => ({
    bodegaId: r.bodegaId,
    items: Number(r.items),
    valor: Number(r.valor),
  }))
}
