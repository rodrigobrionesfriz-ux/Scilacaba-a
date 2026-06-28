"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import type { PanoRow } from "@/types/panos.types"
import { PanoDelete } from "./panos.delete"
import { PanoForm } from "./panos.form"

const numero = (v: number | null) => (v == null ? "—" : v.toLocaleString("es-CL"))

export const buildPanosColumns = ({
  puedeEditar,
}: {
  puedeEditar: boolean
}): ColumnDef<PanoRow>[] => [
  {
    accessorKey: "nombre",
    header: ({ column }) => (
      <SortableHeader column={column}>Nombre</SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.color && (
          <span
            className="size-3 shrink-0 rounded-full"
            style={{ backgroundColor: row.original.color }}
            aria-hidden
          />
        )}
        {row.original.nombre}
      </div>
    ),
  },
  {
    accessorKey: "variedad",
    header: ({ column }) => (
      <SortableHeader column={column}>Variedad</SortableHeader>
    ),
  },
  { accessorKey: "anio", header: "Año" },
  {
    accessorKey: "hectareas",
    header: "Há plant.",
    cell: ({ row }) => numero(row.original.hectareas),
  },
  {
    accessorKey: "hasRiego",
    header: "Há riego",
    cell: ({ row }) => numero(row.original.hasRiego),
  },
  {
    accessorKey: "densidad",
    header: "Densidad",
    cell: ({ row }) => numero(row.original.densidad),
  },
  {
    accessorKey: "plantas",
    header: "N° plantas",
    cell: ({ row }) => numero(row.original.plantas),
  },
  {
    id: "acciones",
    header: "",
    enableSorting: false,
    cell: ({ row }) =>
      puedeEditar ? (
        <div className="flex justify-end gap-1">
          <PanoForm pano={row.original} />
          <PanoDelete pano={row.original} />
        </div>
      ) : null,
  },
]
