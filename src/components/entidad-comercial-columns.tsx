"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import type { EntidadComercial } from "@/schemas/entidad-comercial.schema"

// Columnas compartidas por Proveedores y Clientes. `renderEditar` inyecta el form
// de edición de cada entidad (acción distinta).
export const buildEntidadComercialColumns = ({
  puedeEditar,
  renderEditar,
}: {
  puedeEditar: boolean
  renderEditar: (entidad: EntidadComercial) => ReactNode
}): ColumnDef<EntidadComercial>[] => [
  {
    accessorKey: "codigo",
    header: ({ column }) => (
      <SortableHeader column={column}>Código</SortableHeader>
    ),
  },
  {
    accessorKey: "razonSocial",
    header: ({ column }) => (
      <SortableHeader column={column}>Razón social</SortableHeader>
    ),
  },
  { accessorKey: "giro", header: "Giro" },
  { accessorKey: "comuna", header: "Comuna" },
  { accessorKey: "telefono", header: "Teléfono" },
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
        <div className="flex justify-end">{renderEditar(row.original)}</div>
      ) : null,
  },
]
