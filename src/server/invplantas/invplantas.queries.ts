import { desc } from "drizzle-orm"
import { db } from "@/db/client"
import { invplantas } from "@/db/schema"
import type { InvplantaRow } from "@/types/invplantas.types"
import { esHileraInvertida, narrowPlantas } from "@/utils/invplantas.utils"

// Listado de hileras sincronizadas (lectura online desde Postgres) para la vista
// de revisión. Más recientes primero. Las plantas (blob jsonb heterogéneo) se
// narrowean aquí para que el mapa 2D y el resumen rendericen sin otra query.
export const getInvplantas = async (): Promise<InvplantaRow[]> => {
  const rows = await db
    .select()
    .from(invplantas)
    .orderBy(desc(invplantas.fechaInicio))
  return rows.map((r) => {
    const plantas = narrowPlantas(r.plantas)
    return {
      id: r.id,
      cuartelId: r.cuartelId,
      cuartel: r.cuartel ?? "",
      variedad: r.variedad ?? "",
      hilera: r.hilera ?? "",
      codigoBase: r.codigoBase ?? "",
      portainjerto: r.portainjerto ?? "",
      polinizante: r.polinizante ?? "",
      usuario: r.usuario ?? "",
      countPrincipal: plantas.filter((p) => p.tipo === "principal").length,
      countPoliniz: plantas.filter((p) => p.tipo === "poliniz").length,
      invertida: esHileraInvertida(r.hilera ?? ""),
      plantas,
      fechaInicio: r.fechaInicio.toISOString(),
      fechaSync: r.fechaSync === null ? null : r.fechaSync.toISOString(),
    }
  })
}
