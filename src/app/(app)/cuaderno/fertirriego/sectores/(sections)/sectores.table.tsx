"use client"

import { DataTable } from "@/components/ui/data-table"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import type { SectorRow } from "@/types/fertirriego.types"
import { buildSectoresColumns } from "./sectores.columns"
import { SectorForm } from "./sectores.form"

type SectoresTableProps = {
  sectores: SectorRow[]
  puedeEditar: boolean
}

export const SectoresTable = ({ sectores, puedeEditar }: SectoresTableProps) => {
  const columns = buildSectoresColumns({ puedeEditar })

  return (
    <DataTable
      columns={columns}
      data={sectores}
      emptyMessage="Sin sectores de riego."
      toolbar={(table) => (
        <DataTableToolbar
          table={table}
          placeholder="Buscar por nombre o equipo…"
          mostrarEstado={false}
          nuevo={puedeEditar && <SectorForm />}
        />
      )}
    />
  )
}
