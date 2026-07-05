import { asc, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { equipos } from "@/db/schema"
import type { EquipoRow } from "@/types/equipos.types"

// Nebulizadoras activas, orden alfabético.
export const getEquipos = async (): Promise<EquipoRow[]> => {
  const rows = await db
    .select()
    .from(equipos)
    .where(eq(equipos.activo, true))
    .orderBy(asc(equipos.nombre))
  return rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    capacidad: Number(r.capacidad),
    activo: r.activo,
  }))
}
