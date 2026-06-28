"use client"

import { DataTable } from "@/components/ui/data-table"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import type { PanoRow } from "@/types/panos.types"
import type { OrdenRow } from "@/types/ordenes.types"
import { buildOrdenesColumns } from "./ordenes.columns"
import { OrdenForm } from "./ordenes.form"

type OrdenesTableProps = {
  ordenes: OrdenRow[]
  panos: PanoRow[]
  catalogo: string[]
  puedeEditar: boolean
  puedeConfirmar: boolean
}

export const OrdenesTable = ({
  ordenes,
  panos,
  catalogo,
  puedeEditar,
  puedeConfirmar,
}: OrdenesTableProps) => {
  const columns = buildOrdenesColumns({
    panos,
    catalogo,
    puedeEditar,
    puedeConfirmar,
  })

  return (
    <DataTable
      columns={columns}
      data={ordenes}
      emptyMessage="Sin órdenes de aplicación."
      toolbar={(table) => (
        <DataTableToolbar
          table={table}
          placeholder="Buscar por número o tipo…"
          mostrarEstado={false}
          nuevo={
            puedeEditar && <OrdenForm panos={panos} catalogo={catalogo} />
          }
        />
      )}
    />
  )
}
