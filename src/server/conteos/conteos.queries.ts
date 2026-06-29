import { desc } from "drizzle-orm"
import { db } from "@/db/client"
import { conteos } from "@/db/schema"
import type { ConteoRow } from "@/types/conteos.types"

// Listado de conteos sincronizados (lectura online desde Postgres) para la vista de
// revisión. Más recientes primero. numeric (string en pg) → number; fechas → ISO.
export const getConteos = async (): Promise<ConteoRow[]> => {
  const rows = await db.select().from(conteos).orderBy(desc(conteos.fechaInicio))
  return rows.map((r) => ({
    id: r.id,
    panoNombre: r.panoNombre ?? "",
    variedad: r.variedad ?? "",
    especie: r.especie ?? "",
    etapa: r.etapa ?? "",
    usuario: r.usuario ?? "",
    nArboles: r.nArboles,
    promedioCentros:
      r.promedioCentros === null ? null : Number(r.promedioCentros),
    sincronizado: r.sincronizado,
    fechaInicio: r.fechaInicio.toISOString(),
    fechaFin: r.fechaFin === null ? null : r.fechaFin.toISOString(),
    fechaSync: r.fechaSync === null ? null : r.fechaSync.toISOString(),
  }))
}
