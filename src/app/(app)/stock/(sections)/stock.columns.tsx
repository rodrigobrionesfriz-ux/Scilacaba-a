"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import type { StockRow } from "@/types/stock.types"
import { formatCLP } from "@/utils/money.utils"

export const buildStockColumns = (): ColumnDef<StockRow>[] => [
  {
    accessorKey: "codigoInterno",
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
  {
    accessorKey: "bodega",
    header: "Bodega",
    filterFn: (row, _id, value) =>
      value === "todas" || row.original.bodegaId === value,
  },
  {
    accessorKey: "cantidad",
    header: ({ column }) => (
      <SortableHeader column={column}>Cantidad</SortableHeader>
    ),
    cell: ({ row }) => `${row.original.cantidad} ${row.original.unidadMedida}`,
  },
  {
    accessorKey: "costoPromedio",
    header: "Costo prom.",
    cell: ({ row }) => formatCLP(row.original.costoPromedio),
  },
  {
    accessorKey: "valor",
    header: ({ column }) => (
      <SortableHeader column={column}>Valor</SortableHeader>
    ),
    cell: ({ row }) => formatCLP(row.original.valor),
  },
]
