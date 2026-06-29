import { asc } from "drizzle-orm"
import { db } from "@/db/client"
import { fertirriegoSectores } from "@/db/schema"
import type { SectorRow } from "@/types/fertirriego.types"

// Sectores de riego (fertirriego_sectores). PK = uid de texto.
export const getSectores = async (): Promise<SectorRow[]> => {
  const rows = await db
    .select()
    .from(fertirriegoSectores)
    .orderBy(asc(fertirriegoSectores.nombre))
  return rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    equipo: r.equipo ?? "",
    ha: r.ha === null ? null : Number(r.ha),
    variedad: r.variedad ?? "",
    plantas: r.plantas,
  }))
}
