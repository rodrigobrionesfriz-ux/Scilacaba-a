"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import type { InvplantaRow } from "@/types/invplantas.types"
import { InvplantasMapDialog } from "./invplantas.map"

const fecha = (iso: string | null) =>
  iso === null ? "—" : new Date(iso).toLocaleDateString("es-CL")

export const invplantasColumns = (
  puedeEditar: boolean,
): ColumnDef<InvplantaRow>[] => [
  {
    accessorKey: "codigoBase",
    header: ({ column }) => (
      <SortableHeader column={column}>Código</SortableHeader>
    ),
    cell: ({ row }) => row.original.codigoBase || "—",
  },
  {
    accessorKey: "cuartel",
    header: ({ column }) => (
      <SortableHeader column={column}>Cuartel</SortableHeader>
    ),
    cell: ({ row }) => row.original.cuartel || "—",
  },
  {
    accessorKey: "variedad",
    header: ({ column }) => (
      <SortableHeader column={column}>Variedad</SortableHeader>
    ),
  },
  { accessorKey: "hilera", header: "Hilera" },
  {
    accessorKey: "countPrincipal",
    header: "🌳 Principal",
    cell: ({ row }) => row.original.countPrincipal,
  },
  {
    accessorKey: "countPoliniz",
    header: "🐝 Poliniz.",
    cell: ({ row }) => row.original.countPoliniz,
  },
  {
    id: "total",
    header: "Total",
    cell: ({ row }) =>
      row.original.countPrincipal + row.original.countPoliniz,
  },
  { accessorKey: "usuario", header: "Usuario" },
  {
    accessorKey: "fechaInicio",
    header: ({ column }) => (
      <SortableHeader column={column}>Fecha</SortableHeader>
    ),
    cell: ({ row }) => fecha(row.original.fechaInicio),
  },
  {
    id: "acciones",
    header: "",
    cell: ({ row }) => (
      <InvplantasMapDialog fila={row.original} puedeEditar={puedeEditar} />
    ),
  },
]
