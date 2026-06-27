"use client"

import { DataTable } from "@/components/ui/data-table"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import type { Bodega } from "@/schemas/bodegas.schema"
import { buildBodegasColumns } from "./bodegas.columns"
import { BodegaForm } from "./bodegas.form"

type BodegasTableProps = {
  bodegas: Bodega[]
  puedeCrear: boolean
}

export const BodegasTable = ({ bodegas, puedeCrear }: BodegasTableProps) => {
  const columns = buildBodegasColumns({ puedeEditar: puedeCrear })

  return (
    <DataTable
      columns={columns}
      data={bodegas}
      toolbar={(table) => (
        <DataTableToolbar
          table={table}
          placeholder="Buscar por ID o nombre…"
          nuevo={puedeCrear && <BodegaForm />}
        />
      )}
    />
  )
}
