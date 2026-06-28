"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import type { Bodega } from "@/schemas/bodegas.schema"
import type { StockResumenBodega } from "@/types/stock.types"
import { formatCLP } from "@/utils/money.utils"
import { BodegaForm } from "./bodegas.form"

export const buildBodegasColumns = ({
  stockPorBodega,
  puedeEditar,
}: {
  stockPorBodega: Map<string, StockResumenBodega>
  puedeEditar: boolean
}): ColumnDef<Bodega>[] => [
  {
    accessorKey: "id",
    header: ({ column }) => <SortableHeader column={column}>ID</SortableHeader>,
  },
  {
    accessorKey: "nombre",
    header: ({ column }) => (
      <SortableHeader column={column}>Nombre</SortableHeader>
    ),
  },
  { accessorKey: "direccion", header: "Dirección" },
  {
    accessorKey: "esServicios",
    header: "Tipo",
    cell: ({ row }) =>
      row.original.esServicios ? (
        <Badge variant="secondary">Servicios</Badge>
      ) : (
        <Badge variant="outline">Inventario</Badge>
      ),
  },
  {
    id: "items",
    accessorFn: (r) => stockPorBodega.get(r.id)?.items ?? 0,
    header: ({ column }) => (
      <SortableHeader column={column}>Ítems</SortableHeader>
    ),
    cell: ({ row }) => stockPorBodega.get(row.original.id)?.items ?? 0,
  },
  {
    id: "valorStock",
    accessorFn: (r) => stockPorBodega.get(r.id)?.valor ?? 0,
    header: ({ column }) => (
      <SortableHeader column={column}>Valor</SortableHeader>
    ),
    cell: ({ row }) =>
      formatCLP(stockPorBodega.get(row.original.id)?.valor ?? 0),
  },
  {
    accessorKey: "activo",
    header: "Estado",
    cell: ({ row }) =>
      row.original.activo ? (
        <Badge>Activa</Badge>
      ) : (
        <Badge variant="secondary">Inactiva</Badge>
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
          <BodegaForm bodega={row.original} />
        </div>
      ) : null,
  },
]
