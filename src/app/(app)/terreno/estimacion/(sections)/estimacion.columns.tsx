"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import type { EstimacionRow } from "@/types/estimaciones.types"
import { EstimacionDelete } from "./estimacion.delete"
import { EstimacionDetalleDialog } from "./estimacion.detalle"
import { EstimacionExportar } from "./estimacion.exportar"

const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-CL")

const kg = (v: number | null) =>
  v == null ? "—" : v.toLocaleString("es-CL", { maximumFractionDigits: 1 })

export const estimacionColumns: ColumnDef<EstimacionRow>[] = [
  {
    accessorKey: "nombre",
    header: ({ column }) => (
      <SortableHeader column={column}>Nombre</SortableHeader>
    ),
  },
  {
    accessorKey: "fecha",
    header: ({ column }) => (
      <SortableHeader column={column}>Fecha</SortableHeader>
    ),
    cell: ({ row }) => fecha(row.original.fecha),
  },
  { accessorKey: "usuario", header: "Usuario" },
  {
    accessorKey: "totalKg",
    header: "Total kg",
    cell: ({ row }) => kg(row.original.totalKg),
  },
  {
    id: "acciones",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <EstimacionDetalleDialog version={row.original} />
        <EstimacionExportar id={row.original.id} />
        <EstimacionDelete version={row.original} />
      </div>
    ),
  },
]
