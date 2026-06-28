"use client"

import { DataTable } from "@/components/ui/data-table"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import type { ConfirmacionRow } from "@/types/ordenes.types"
import { buildConfirmacionesColumns } from "./confirmaciones.columns"

type ConfirmacionesTableProps = {
  confirmaciones: ConfirmacionRow[]
  puedeConfirmar: boolean
}

export const ConfirmacionesTable = ({
  confirmaciones,
  puedeConfirmar,
}: ConfirmacionesTableProps) => {
  const columns = buildConfirmacionesColumns({ puedeConfirmar })

  return (
    <DataTable
      columns={columns}
      data={confirmaciones}
      emptyMessage="Sin confirmaciones registradas."
      toolbar={(table) => (
        <DataTableToolbar
          table={table}
          placeholder="Buscar por orden u operador…"
          mostrarEstado={false}
        />
      )}
    />
  )
}
