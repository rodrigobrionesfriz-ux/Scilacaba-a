"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import type { AuditRow } from "@/types/audit.types"
import { fmtFechaHora } from "@/utils/fecha.utils"

export const buildAuditoriaColumns = (): ColumnDef<AuditRow>[] => [
  {
    accessorKey: "fecha",
    header: ({ column }) => (
      <SortableHeader column={column}>Fecha</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {fmtFechaHora(row.original.fecha)}
      </span>
    ),
  },
  {
    accessorKey: "usuario",
    header: ({ column }) => (
      <SortableHeader column={column}>Usuario</SortableHeader>
    ),
  },
  {
    accessorKey: "accion",
    header: "Acción",
    cell: ({ row }) => <Badge variant="secondary">{row.original.accion}</Badge>,
  },
  {
    accessorKey: "detalle",
    header: "Detalle",
  },
  {
    accessorKey: "referencia",
    header: "Referencia",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.referencia}</span>
    ),
  },
]
