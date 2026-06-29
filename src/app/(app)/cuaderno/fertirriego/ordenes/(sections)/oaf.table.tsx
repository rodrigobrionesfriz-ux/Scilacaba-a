"use client"

import { DataTable } from "@/components/ui/data-table"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import type {
  ConfigFert,
  OafRow,
  ProductoFertRow,
  SectorRow,
} from "@/types/fertirriego.types"
import { buildOafColumns } from "./oaf.columns"
import { OafForm } from "./oaf.form"

type OafTableProps = {
  ordenes: OafRow[]
  sectores: SectorRow[]
  productos: ProductoFertRow[]
  config: ConfigFert
  puedeEditar: boolean
  puedeConfirmar: boolean
}

export const OafTable = ({
  ordenes,
  sectores,
  productos,
  config,
  puedeEditar,
  puedeConfirmar,
}: OafTableProps) => {
  const columns = buildOafColumns({
    sectores,
    productos,
    config,
    puedeEditar,
    puedeConfirmar,
  })

  return (
    <DataTable
      columns={columns}
      data={ordenes}
      emptyMessage="Sin órdenes de fertirriego."
      toolbar={(table) => (
        <DataTableToolbar
          table={table}
          placeholder="Buscar por número o estado…"
          mostrarEstado={false}
          nuevo={
            puedeEditar && (
              <OafForm sectores={sectores} productos={productos} config={config} />
            )
          }
        />
      )}
    />
  )
}
