"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import type { ConteoRow } from "@/types/conteos.types"

const fecha = (iso: string | null) =>
  iso === null ? "—" : new Date(iso).toLocaleDateString("es-CL")

const numero = (v: number | null) =>
  v == null ? "—" : v.toLocaleString("es-CL", { maximumFractionDigits: 1 })

export const conteosColumns: ColumnDef<ConteoRow>[] = [
  {
    accessorKey: "panoNombre",
    header: ({ column }) => <SortableHeader column={column}>Paño</SortableHeader>,
    cell: ({ row }) => row.original.panoNombre || "—",
  },
  {
    accessorKey: "variedad",
    header: ({ column }) => (
      <SortableHeader column={column}>Variedad</SortableHeader>
    ),
  },
  { accessorKey: "etapa", header: "Etapa" },
  {
    accessorKey: "nArboles",
    header: "N° árboles",
    cell: ({ row }) => numero(row.original.nArboles),
  },
  {
    accessorKey: "promedioCentros",
    header: "Prom. centros",
    cell: ({ row }) => numero(row.original.promedioCentros),
  },
  { accessorKey: "usuario", header: "Usuario" },
  {
    accessorKey: "fechaInicio",
    header: ({ column }) => (
      <SortableHeader column={column}>Fecha</SortableHeader>
    ),
    cell: ({ row }) => fecha(row.original.fechaInicio),
  },
]
