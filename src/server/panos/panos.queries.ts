import { asc } from "drizzle-orm"
import { db } from "@/db/client"
import { panos } from "@/db/schema"
import type { PanoRow } from "@/types/panos.types"

// Listado de paños. Orden por nombre. Los numeric (string en pg) se normalizan a
// number para la UI; deh/dsh/portaInjerto/tipo/prodPct no se exponen en 6a.
export const getPanos = async (): Promise<PanoRow[]> => {
  const rows = await db.select().from(panos).orderBy(asc(panos.nombre))
  return rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    variedad: r.variedad ?? "",
    anio: r.anio ?? "",
    hectareas: r.hectareas === null ? null : Number(r.hectareas),
    hasRiego: r.hasRiego === null ? null : Number(r.hasRiego),
    densidad: r.densidad === null ? null : Number(r.densidad),
    plantas: r.plantas ?? null,
    color: r.color ?? "",
  }))
}
