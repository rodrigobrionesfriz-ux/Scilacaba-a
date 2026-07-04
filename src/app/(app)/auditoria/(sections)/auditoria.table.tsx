"use client"

import { useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import type { AuditRow } from "@/types/audit.types"
import { buildAuditoriaColumns } from "./auditoria.columns"

type AuditoriaTableProps = {
  registros: AuditRow[]
}

export const AuditoriaTable = ({ registros }: AuditoriaTableProps) => {
  const columns = buildAuditoriaColumns()
  const [busqueda, setBusqueda] = useState("")

  return (
    <DataTable
      columns={columns}
      data={registros}
      emptyMessage="Sin registros de auditoría."
      toolbar={(table) => (
        <Input
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            table.setGlobalFilter(e.target.value)
          }}
          placeholder="Buscar usuario, acción o detalle…"
          className="w-80"
        />
      )}
    />
  )
}
