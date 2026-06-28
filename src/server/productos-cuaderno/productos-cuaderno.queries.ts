import { asc } from "drizzle-orm"
import { db } from "@/db/client"
import { fieldProducts } from "@/db/schema"
import type { ProductoCuadernoRow } from "@/types/productos-cuaderno.types"

// Catálogo de productos del cuaderno (field_products). PK = nombre. `aportes`
// (jsonb) no se expone en 6a.
export const getProductosCuaderno = async (): Promise<ProductoCuadernoRow[]> => {
  const rows = await db
    .select()
    .from(fieldProducts)
    .orderBy(asc(fieldProducts.nombre))
  return rows.map((r) => ({
    nombre: r.nombre,
    tipo: r.tipo ?? "",
    unidad: r.unidad ?? "",
    dosis: r.dosis ?? "",
    ingredienteActivo: r.ingredienteActivo ?? "",
    objetivo: r.objetivo ?? "",
  }))
}
