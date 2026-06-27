import { asc } from "drizzle-orm"
import { db } from "@/db/client"
import { warehouses } from "@/db/schema"
import type { Bodega } from "@/schemas/bodegas.schema"

export const getBodegas = async (): Promise<Bodega[]> => {
  const rows = await db.select().from(warehouses).orderBy(asc(warehouses.nombre))
  return rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    direccion: r.direccion ?? "",
    esServicios: r.esServicios,
    activo: r.activo,
  }))
}
