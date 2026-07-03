"use client"

import { DataTable } from "@/components/ui/data-table"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import { ExportarExcel } from "@/components/ui/exportar-excel"
import type { CentroCosto } from "@/schemas/centros-costo.schema"
import { exportarCentrosCostoExcel } from "@/server/centros-costo/centros-costo.actions"
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
          acciones={<ExportarExcel action={exportarCentrosCostoExcel} />}
          nuevo={puedeCrear && <CentroCostoForm areas={areas} />}
        />
      )}
    />
  )
}
