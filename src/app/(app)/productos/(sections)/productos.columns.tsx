"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import type { Group, ProductType } from "@/types/catalogos.types"
import type { ProductoRow } from "@/types/productos.types"
import type { StockResumenProducto } from "@/types/stock.types"
import { formatCLP } from "@/utils/money.utils"
import { ProductoDelete } from "./productos.delete"
import { ProductoForm } from "./productos.form"

type ColumnasOpts = {
  tipos: ProductType[]
  grupos: Group[]
  stockPorProducto: Map<string, StockResumenProducto>
  puedeEditar: boolean
  puedeEliminar: boolean
}

export const buildProductosColumns = ({
  tipos,
  grupos,
  stockPorProducto,
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
    id: "stock",
    accessorFn: (r) => stockPorProducto.get(r.codigoInterno)?.cantidad ?? 0,
    header: ({ column }) => (
      <SortableHeader column={column}>Stock</SortableHeader>
    ),
    cell: ({ row }) =>
      `${stockPorProducto.get(row.original.codigoInterno)?.cantidad ?? 0} ${row.original.unidadMedida}`,
  },
  {
    id: "valorStock",
    accessorFn: (r) => stockPorProducto.get(r.codigoInterno)?.valor ?? 0,
    header: ({ column }) => (
      <SortableHeader column={column}>Valor</SortableHeader>
    ),
    cell: ({ row }) =>
      formatCLP(stockPorProducto.get(row.original.codigoInterno)?.valor ?? 0),
  },
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
