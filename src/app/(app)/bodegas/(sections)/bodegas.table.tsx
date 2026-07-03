"use client"

import { DataTable } from "@/components/ui/data-table"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import { ExportarExcel } from "@/components/ui/exportar-excel"
import type { Bodega } from "@/schemas/bodegas.schema"
import { exportarBodegasExcel } from "@/server/bodegas/bodegas.actions"
import type { StockResumenBodega } from "@/types/stock.types"
import { buildBodegasColumns } from "./bodegas.columns"
import { BodegaForm } from "./bodegas.form"

type BodegasTableProps = {
  bodegas: Bodega[]
  stockPorBodega: Map<string, StockResumenBodega>
  puedeCrear: boolean
}

export const BodegasTable = ({
  bodegas,
  stockPorBodega,
  puedeCrear,
}: BodegasTableProps) => {
  const columns = buildBodegasColumns({
    stockPorBodega,
    puedeEditar: puedeCrear,
  })

  return (
    <DataTable
      columns={columns}
      data={bodegas}
      toolbar={(table) => (
        <DataTableToolbar
          table={table}
          placeholder="Buscar por ID o nombre…"
          acciones={<ExportarExcel action={exportarBodegasExcel} />}
          nuevo={puedeCrear && <BodegaForm />}
        />
      )}
    />
  )
}
