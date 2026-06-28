"use client"

import type { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import { DIRECCION_LABEL } from "@/constants/movimientos.constants"
import type { MovimientoRow } from "@/types/movimientos.types"
import { formatCLP } from "@/utils/money.utils"
import { MovimientoAnular } from "./movimientos.anular"

export const buildMovimientosColumns = ({
  puedeAnular,
}: {
  puedeAnular: boolean
}): ColumnDef<MovimientoRow>[] => [
  {
    accessorKey: "numero",
    header: ({ column }) => (
      <SortableHeader column={column}>Número</SortableHeader>
    ),
  },
  {
    accessorKey: "fecha",
    header: ({ column }) => (
      <SortableHeader column={column}>Fecha</SortableHeader>
    ),
    cell: ({ row }) => new Date(row.original.fecha).toLocaleDateString("es-CL"),
  },
  {
    accessorKey: "direccion",
    header: "Dir.",
    cell: ({ row }) => (
      <Badge variant={row.original.direccion === "ENT" ? "default" : "secondary"}>
        {DIRECCION_LABEL[row.original.direccion]}
      </Badge>
    ),
    filterFn: (row, _id, value) => row.original.direccion === value,
  },
  { accessorKey: "tipoMovimiento", header: "Tipo" },
  { accessorKey: "bodega", header: "Bodega" },
  { accessorKey: "contraparte", header: "Proveedor / Cliente" },
  {
    accessorKey: "valor",
    header: ({ column }) => (
      <SortableHeader column={column}>Valor</SortableHeader>
    ),
    cell: ({ row }) => formatCLP(row.original.valor),
  },
  {
    accessorKey: "anulado",
    header: "Estado",
    cell: ({ row }) =>
      row.original.anulado ? (
        <Badge variant="secondary">Anulado</Badge>
      ) : (
        <Badge variant="outline">Vigente</Badge>
      ),
  },
  {
    id: "acciones",
    header: "",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={
            <Link href={`/movimientos/${encodeURIComponent(row.original.numero)}`}>
              Ver
            </Link>
          }
        />
        {puedeAnular && !row.original.anulado && (
          <MovimientoAnular numero={row.original.numero} />
        )}
      </div>
    ),
  },
]
