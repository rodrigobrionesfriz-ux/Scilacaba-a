"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import type { ProductoCuadernoRow } from "@/types/productos-cuaderno.types"
import { ProductoCuadernoDelete } from "./productos-cuaderno.delete"
import { ProductoCuadernoForm } from "./productos-cuaderno.form"

export const buildProductosCuadernoColumns = ({
  puedeEditar,
}: {
  puedeEditar: boolean
}): ColumnDef<ProductoCuadernoRow>[] => [
  {
    accessorKey: "nombre",
    header: ({ column }) => (
      <SortableHeader column={column}>Nombre</SortableHeader>
    ),
  },
  {
    accessorKey: "tipo",
    header: ({ column }) => <SortableHeader column={column}>Tipo</SortableHeader>,
  },
  { accessorKey: "ingredienteActivo", header: "Ingrediente activo" },
  { accessorKey: "objetivo", header: "Objetivo" },
  { accessorKey: "dosis", header: "Dosis" },
  { accessorKey: "unidad", header: "Unidad" },
  {
    id: "acciones",
    header: "",
    enableSorting: false,
    cell: ({ row }) =>
      puedeEditar ? (
        <div className="flex justify-end gap-1">
          <ProductoCuadernoForm producto={row.original} />
          <ProductoCuadernoDelete producto={row.original} />
        </div>
      ) : null,
  },
]
