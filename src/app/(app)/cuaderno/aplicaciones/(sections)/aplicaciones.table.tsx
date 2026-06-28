"use client"

import { DataTable } from "@/components/ui/data-table"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import type { AplicacionRow } from "@/types/aplicaciones.types"
import { buildAplicacionesColumns } from "./aplicaciones.columns"
import { AplicacionForm } from "./aplicaciones.form"

type Opcion = { value: string; label: string }

type AplicacionesTableProps = {
  aplicaciones: AplicacionRow[]
  panos: Opcion[]
  productos: string[]
  puedeEditar: boolean
}

export const AplicacionesTable = ({
  aplicaciones,
  panos,
  productos,
  puedeEditar,
}: AplicacionesTableProps) => {
  const columns = buildAplicacionesColumns({ panos, productos, puedeEditar })

  return (
    <DataTable
      columns={columns}
      data={aplicaciones}
      emptyMessage="Sin aplicaciones registradas."
      toolbar={(table) => (
        <DataTableToolbar
          table={table}
          placeholder="Buscar por producto o paño…"
          mostrarEstado={false}
          nuevo={
            puedeEditar && (
              <AplicacionForm panos={panos} productos={productos} />
            )
          }
        />
      )}
    />
  )
}
