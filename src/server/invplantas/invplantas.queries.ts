import { desc } from "drizzle-orm"
import { db } from "@/db/client"
import { invplantas } from "@/db/schema"
import type { InvplantaRow } from "@/types/invplantas.types"
import { esHileraInvertida, narrowPlantas } from "@/utils/invplantas.utils"

// Listado de hileras sincronizadas (lectura online desde Postgres) para la vista
// de revisión. Más recientes primero. Las plantas (blob jsonb heterogéneo) se
// narrowean aquí para que el mapa 2D y el resumen rendericen sin otra query.
export const getInvplantas = async (): Promise<InvplantaRow[]> => {
  // Proyección explícita: traemos `plantas` (lo usa el mapa 2D y el resumen) pero
  // NO los blobs `secuencia`/`gpsInicio`/`gpsFin`, que la vista no consume.
  const rows = await db
    .select({
      id: invplantas.id,
      cuartelId: invplantas.cuartelId,
      cuartel: invplantas.cuartel,
      variedad: invplantas.variedad,
      hilera: invplantas.hilera,
      codigoBase: invplantas.codigoBase,
      portainjerto: invplantas.portainjerto,
      polinizante: invplantas.polinizante,
      usuario: invplantas.usuario,
      plantas: invplantas.plantas,
      fechaInicio: invplantas.fechaInicio,
      fechaSync: invplantas.fechaSync,
    })
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
