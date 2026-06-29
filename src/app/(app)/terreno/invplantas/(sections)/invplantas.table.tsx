"use client"

import { useMemo } from "react"
import { DataTable } from "@/components/ui/data-table"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import type { InvplantaRow } from "@/types/invplantas.types"
import { invplantasColumns } from "./invplantas.columns"

export const InvplantasTable = ({
  filas,
  puedeEditar,
}: {
  filas: InvplantaRow[]
  puedeEditar: boolean
}) => {
  const columns = useMemo(() => invplantasColumns(puedeEditar), [puedeEditar])
  return (
    <DataTable
      columns={columns}
      data={filas}
      emptyMessage="Aún no hay hileras sincronizadas."
      toolbar={(table) => (
        <DataTableToolbar
          table={table}
          placeholder="Buscar por cuartel o variedad…"
          mostrarEstado={false}
        />
      )}
    />
  )
}
