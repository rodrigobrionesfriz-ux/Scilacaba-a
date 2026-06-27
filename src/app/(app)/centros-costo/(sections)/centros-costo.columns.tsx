"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import type { CentroCosto } from "@/schemas/centros-costo.schema"
import { CentroCostoForm } from "./centros-costo.form"

export const buildCentrosCostoColumns = ({
  areas,
  puedeEditar,
}: {
  areas: string[]
  puedeEditar: boolean
}): ColumnDef<CentroCosto>[] => [
  {
    accessorKey: "codigo",
    header: ({ column }) => (
      <SortableHeader column={column}>Código</SortableHeader>
    ),
  },
  {
    accessorKey: "descripcion",
    header: ({ column }) => (
      <SortableHeader column={column}>Descripción</SortableHeader>
    ),
  },
  { accessorKey: "area", header: "Área" },
  { accessorKey: "responsable", header: "Responsable" },
  {
    accessorKey: "activo",
    header: "Estado",
    cell: ({ row }) =>
      row.original.activo ? (
        <Badge>Activo</Badge>
      ) : (
        <Badge variant="secondary">Inactivo</Badge>
      ),
    filterFn: (row, _id, value) => {
      if (value === "activos") return row.original.activo
      if (value === "inactivos") return !row.original.activo
      return true
    },
  },
  {
    id: "acciones",
    header: "",
    enableSorting: false,
    cell: ({ row }) =>
      puedeEditar ? (
        <div className="flex justify-end">
          <CentroCostoForm centro={row.original} areas={areas} />
        </div>
      ) : null,
  },
]
