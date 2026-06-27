"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import type { Group, ProductType } from "@/types/catalogos.types"
import type { ProductoRow } from "@/types/productos.types"
import { ProductoDelete } from "./productos.delete"
import { ProductoForm } from "./productos.form"

type ColumnasOpts = {
  tipos: ProductType[]
  grupos: Group[]
  puedeEditar: boolean
  puedeEliminar: boolean
}

export const buildProductosColumns = ({
  tipos,
  grupos,
  puedeEditar,
  puedeEliminar,
}: ColumnasOpts): ColumnDef<ProductoRow>[] => [
  {
    accessorKey: "codigoInterno",
    header: ({ column }) => (
      <SortableHeader column={column}>Código</SortableHeader>
    ),
  },
  { accessorKey: "codigoEan", header: "EAN" },
  {
    accessorKey: "descripcion",
    header: ({ column }) => (
      <SortableHeader column={column}>Descripción</SortableHeader>
    ),
  },
  { accessorKey: "tipoProducto", header: "Tipo" },
  { accessorKey: "grupo", header: "Grupo" },
  { accessorKey: "unidadMedida", header: "UM" },
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
      puedeEditar || puedeEliminar ? (
        <div className="flex justify-end gap-1">
          {puedeEditar && (
            <ProductoForm producto={row.original} tipos={tipos} grupos={grupos} />
          )}
          {puedeEliminar && <ProductoDelete producto={row.original} />}
        </div>
      ) : null,
  },
]
