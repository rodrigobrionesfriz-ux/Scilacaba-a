"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import type { ConfirmacionRow } from "@/types/ordenes.types"
import { fmtCantidad } from "@/utils/cantidad.utils"
import { ConfirmacionDelete } from "./confirmaciones.delete"

export const buildConfirmacionesColumns = ({
  puedeConfirmar,
}: {
  puedeConfirmar: boolean
}): ColumnDef<ConfirmacionRow>[] => [
  {
    accessorKey: "ordenNumero",
    header: ({ column }) => (
      <SortableHeader column={column}>Orden</SortableHeader>
    ),
  },
  {
    accessorKey: "fechaApp",
    header: ({ column }) => (
      <SortableHeader column={column}>Fecha</SortableHeader>
    ),
  },
  { accessorKey: "operador", header: "Operador" },
  { accessorKey: "equipo", header: "Equipo" },
  {
    accessorKey: "aguaReal",
    header: "Agua real (L)",
    cell: ({ row }) => fmtCantidad(row.original.aguaReal),
  },
  {
    id: "panos",
    header: "Paños",
    cell: ({ row }) => row.original.panoIds.length,
  },
  {
    id: "acciones",
    header: "",
    enableSorting: false,
    cell: ({ row }) =>
      puedeConfirmar ? (
        <div className="flex justify-end">
          <ConfirmacionDelete confirmacion={row.original} />
        </div>
      ) : null,
  },
]
