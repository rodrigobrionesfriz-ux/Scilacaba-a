"use client"

import { DataTable } from "@/components/ui/data-table"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import type { PanoRow } from "@/types/panos.types"
import { buildPanosColumns } from "./panos.columns"
import { PanoForm } from "./panos.form"

type PanosTableProps = {
  panos: PanoRow[]
  puedeEditar: boolean
}

export const PanosTable = ({ panos, puedeEditar }: PanosTableProps) => {
  const columns = buildPanosColumns({ puedeEditar })

  return (
    <DataTable
      columns={columns}
      data={panos}
      emptyMessage="Sin paños registrados."
      toolbar={(table) => (
        <DataTableToolbar
          table={table}
          placeholder="Buscar por nombre o variedad…"
          mostrarEstado={false}
          nuevo={puedeEditar && <PanoForm />}
        />
      )}
    />
  )
}
