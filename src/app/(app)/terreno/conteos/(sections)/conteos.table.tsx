"use client"

import { DataTable } from "@/components/ui/data-table"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import type { ConteoRow } from "@/types/conteos.types"
import { conteosColumns } from "./conteos.columns"

export const ConteosTable = ({ conteos }: { conteos: ConteoRow[] }) => (
  <DataTable
    columns={conteosColumns}
    data={conteos}
    emptyMessage="Aún no hay conteos sincronizados."
    toolbar={(table) => (
      <DataTableToolbar
        table={table}
        placeholder="Buscar por paño o variedad…"
        mostrarEstado={false}
      />
    )}
  />
)
