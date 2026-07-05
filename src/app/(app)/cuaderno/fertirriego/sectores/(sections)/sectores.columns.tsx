"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import type { SectorRow } from "@/types/fertirriego.types"
import { fmtCantidad } from "@/utils/cantidad.utils"
import { SectorDelete } from "./sectores.delete"
import { SectorForm } from "./sectores.form"

export const buildSectoresColumns = ({
  puedeEditar,
}: {
  puedeEditar: boolean
}): ColumnDef<SectorRow>[] => [
  {
    accessorKey: "nombre",
    header: ({ column }) => (
      <SortableHeader column={column}>Nombre</SortableHeader>
    ),
  },
  {
    accessorKey: "equipo",
    header: ({ column }) => (
      <SortableHeader column={column}>Equipo</SortableHeader>
    ),
  },
  {
    accessorKey: "ha",
    header: "Há",
    cell: ({ row }) => fmtCantidad(row.original.ha),
  },
  { accessorKey: "variedad", header: "Variedad" },
  {
    accessorKey: "plantas",
    header: "N° plantas",
    cell: ({ row }) => fmtCantidad(row.original.plantas),
  },
  {
    id: "acciones",
    header: "",
    enableSorting: false,
    cell: ({ row }) =>
      puedeEditar ? (
        <div className="flex justify-end gap-1">
          <SectorForm sector={row.original} />
          <SectorDelete sector={row.original} />
        </div>
      ) : null,
  },
]
