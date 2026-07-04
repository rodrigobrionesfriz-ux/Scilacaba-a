import { ExportarExcel } from "@/components/ui/exportar-excel"
import {
  AUDITORIA_SUBTITLE,
  AUDITORIA_TITLE,
} from "@/constants/auditoria.constants"
import { exportarAuditoriaExcel } from "@/server/audit/audit.actions"
import { getAuditoria } from "@/server/audit/audit.queries"
import { AuditoriaTable } from "./auditoria.table"

export const AuditoriaView = async () => {
  const registros = await getAuditoria()

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{AUDITORIA_TITLE}</h1>
          <p className="text-muted-foreground">{AUDITORIA_SUBTITLE}</p>
        </div>
        <ExportarExcel action={exportarAuditoriaExcel} />
      </header>
      <AuditoriaTable registros={registros} />
    </div>
  )
}
