"use client"

import type { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import { TOMA_ESTADOS } from "@/constants/tomas.constants"
import type { TomaRow } from "@/types/tomas.types"

export const buildTomasColumns = (): ColumnDef<TomaRow>[] => [
  {
    accessorKey: "numero",
    header: ({ column }) => (
      <SortableHeader column={column}>Número</SortableHeader>
    ),
  },
  {
    accessorKey: "creadoAt",
    header: ({ column }) => (
      <SortableHeader column={column}>Fecha</SortableHeader>
    ),
    cell: ({ row }) =>
      new Date(row.original.creadoAt).toLocaleDateString("es-CL"),
  },
  { accessorKey: "bodega", header: "Bodega" },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => {
      const meta = TOMA_ESTADOS[row.original.estado]
      return (
        <Badge variant={meta?.variant ?? "outline"}>
          {meta?.label ?? row.original.estado}
        </Badge>
      )
    },
    filterFn: (row, _id, value) => row.original.estado === value,
  },
  { accessorKey: "usuario", header: "Operador" },
  {
    id: "conteo",
    header: "Conteo",
    enableSorting: false,
    cell: ({ row }) =>
      `${row.original.conteadas} / ${row.original.totalLineas}`,
  },
  {
    accessorKey: "conDiferencia",
    header: ({ column }) => (
      <SortableHeader column={column}>Diferencias</SortableHeader>
    ),
  },
  {
    id: "acciones",
    header: "",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={
            <Link href={`/tomas/${encodeURIComponent(row.original.id)}`}>
              Ver
            </Link>
          }
        />
      </div>
    ),
  },
]
