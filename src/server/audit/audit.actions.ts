"use server"

import { construirExcel } from "@/lib/xlsx"
import { getAuditoria } from "@/server/audit/audit.queries"
import { requireAdmin } from "@/server/auth/auth.queries"
import type { ExportResult } from "@/types/export.types"
import { fmtFechaHora } from "@/utils/fecha.utils"

// Exporta la auditoría (últimas 500) a Excel. Solo admin. Nuevo respecto al
// monolito, que solo la incluía en el dump JSON global (index.html:4450).
export const exportarAuditoriaExcel = async (): Promise<ExportResult> => {
  await requireAdmin()
  const filas = await getAuditoria()
  const base64 = await construirExcel([
    {
      nombre: "Auditoría",
      columnas: [
        { header: "Fecha", key: "fecha", width: 20 },
        { header: "Usuario", key: "usuario", width: 20 },
        { header: "Acción", key: "accion", width: 24 },
        { header: "Detalle", key: "detalle", width: 48 },
        { header: "Referencia", key: "referencia", width: 20 },
      ],
      filas: filas.map((f) => ({ ...f, fecha: fmtFechaHora(f.fecha) })),
    },
  ])
  return { ok: true, base64, filename: "auditoria.xlsx" }
}
