"use client"

import { DataTable } from "@/components/ui/data-table"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import type { EstimacionRow } from "@/types/estimaciones.types"
import { estimacionColumns } from "./estimacion.columns"

export const EstimacionTable = ({
  versiones,
}: {
  versiones: EstimacionRow[]
}) => (
  <DataTable
    columns={estimacionColumns}
    data={versiones}
    emptyMessage="Aún no hay estimaciones guardadas."
    toolbar={(table) => (
      <DataTableToolbar
        table={table}
        placeholder="Buscar por nombre…"
        mostrarEstado={false}
      />
    )}
  />
)
