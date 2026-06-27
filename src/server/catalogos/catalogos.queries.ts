import { asc, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { groups, productTypes } from "@/db/schema"
import type { Group, ProductType } from "@/types/catalogos.types"

// Tipos de producto activos (para el select de tipo en el form de Productos).
export const getProductTypes = async (): Promise<ProductType[]> => {
  const rows = await db
    .select()
    .from(productTypes)
    .where(eq(productTypes.activo, true))
    .orderBy(asc(productTypes.nombre))
  return rows.map((r) => ({ nombre: r.nombre, descripcion: r.descripcion }))
}

// Grupos con sus subgrupos (el subgrupo del form depende del grupo elegido).
export const getGroups = async (): Promise<Group[]> => {
  const rows = await db.select().from(groups).orderBy(asc(groups.nombre))
  return rows.map((r) => ({ nombre: r.nombre, subgrupos: r.subgrupos }))
}
