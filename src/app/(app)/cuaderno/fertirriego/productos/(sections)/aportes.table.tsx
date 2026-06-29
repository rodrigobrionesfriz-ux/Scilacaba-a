"use client"

import { DataTable } from "@/components/ui/data-table"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import type { ProductoFertRow } from "@/types/fertirriego.types"
import { buildAportesColumns } from "./aportes.columns"

type AportesTableProps = {
  productos: ProductoFertRow[]
  puedeEditar: boolean
}

export const AportesTable = ({ productos, puedeEditar }: AportesTableProps) => {
  const columns = buildAportesColumns({ puedeEditar })

  return (
    <DataTable
      columns={columns}
      data={productos}
      emptyMessage="Sin fertilizantes de suelo ni enmiendas en el catálogo."
      toolbar={(table) => (
        <DataTableToolbar
          table={table}
          placeholder="Buscar por producto…"
          mostrarEstado={false}
        />
      )}
    />
  )
}
