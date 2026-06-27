import { asc } from "drizzle-orm"
import { db } from "@/db/client"
import { products } from "@/db/schema"
import type { ProductoRow } from "@/types/productos.types"

// Listado de productos (catálogo). Orden por código interno. Las columnas de
// stock/valor llegan en Fase 4 (dependen de PPP/movimientos).
export const getProductos = async (): Promise<ProductoRow[]> => {
  const rows = await db
    .select()
    .from(products)
    .orderBy(asc(products.codigoInterno))
  return rows.map((r) => ({
    codigoInterno: r.codigoInterno,
    descripcion: r.descripcion,
    unidadMedida: r.unidadMedida,
    tipoProducto: r.tipoProducto ?? "",
    grupo: r.grupo ?? "",
    subGrupo: r.subGrupo ?? "",
    codigoEan: r.codigoEan ?? "",
    manejaAtributos: r.manejaAtributos,
    inventariable: r.inventariable,
    stockMinimo: Number(r.stockMinimo),
    aplicaIva: r.aplicaIva,
    aplicaIec: r.aplicaIec,
    aplicaIla: r.aplicaIla,
    ccTipo: r.ccTipo ?? "",
    ccIngredienteActivo: r.ccIngredienteActivo ?? "",
    ccObjetivo: r.ccObjetivo ?? "",
    ccDosis: r.ccDosis === null ? null : Number(r.ccDosis),
    ccUnidad: r.ccUnidad ?? "",
    activo: r.activo,
  }))
}
