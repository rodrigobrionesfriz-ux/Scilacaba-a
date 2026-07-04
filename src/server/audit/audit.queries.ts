import { desc } from "drizzle-orm"
import { AUDIT_LIMITE } from "@/constants/auditoria.constants"
import { db } from "@/db/client"
import { audit } from "@/db/schema"
import type { AuditRow } from "@/types/audit.types"

// Últimas N acciones (desc por fecha). Los campos NULL de registros migrados se
// normalizan a "". Lectura consumida por la vista adminOnly.
export const getAuditoria = async (): Promise<AuditRow[]> => {
  const rows = await db
    .select()
    .from(audit)
    .orderBy(desc(audit.fecha))
    .limit(AUDIT_LIMITE)
  return rows.map((r) => ({
    id: r.id,
    fecha: r.fecha.toISOString(),
    usuario: r.usuario ?? "",
    accion: r.accion ?? "",
    detalle: r.detalle ?? "",
    referencia: r.referencia ?? "",
  }))
}
