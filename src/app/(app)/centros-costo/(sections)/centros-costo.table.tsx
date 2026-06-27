"use client"

import { DataTable } from "@/components/ui/data-table"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import type { CentroCosto } from "@/schemas/centros-costo.schema"
import { buildCentrosCostoColumns } from "./centros-costo.columns"
import { CentroCostoForm } from "./centros-costo.form"

type CentrosCostoTableProps = {
  centros: CentroCosto[]
  areas: string[]
  puedeCrear: boolean
}

export const CentrosCostoTable = ({
  centros,
  areas,
  puedeCrear,
}: CentrosCostoTableProps) => {
  const columns = buildCentrosCostoColumns({ areas, puedeEditar: puedeCrear })

  return (
    <DataTable
      columns={columns}
      data={centros}
      toolbar={(table) => (
        <DataTableToolbar
          table={table}
          placeholder="Buscar código, descripción o área…"
          nuevo={puedeCrear && <CentroCostoForm areas={areas} />}
        />
      )}
    />
  )
}
