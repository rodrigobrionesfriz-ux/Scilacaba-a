"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import {
  ESTADO_ORDEN_COMPLETA,
  ESTADO_ORDEN_PARCIAL,
} from "@/constants/cuaderno.constants"
import type { PanoRow } from "@/types/panos.types"
import type { EstadoOrden, OrdenRow } from "@/types/ordenes.types"
import { OrdenConfirmar } from "./ordenes.confirmar"
import { OrdenDelete } from "./ordenes.delete"
import { OrdenDetalle } from "./ordenes.detalle"
import { OrdenForm } from "./ordenes.form"

const variantePorEstado = (estado: EstadoOrden) =>
  estado === ESTADO_ORDEN_COMPLETA
    ? "default"
    : estado === ESTADO_ORDEN_PARCIAL
      ? "secondary"
      : "outline"

type ColumnasProps = {
  panos: PanoRow[]
  catalogo: string[]
  puedeEditar: boolean
  puedeConfirmar: boolean
}

export const buildOrdenesColumns = ({
  panos,
  catalogo,
  puedeEditar,
  puedeConfirmar,
}: ColumnasProps): ColumnDef<OrdenRow>[] => [
  {
    accessorKey: "numero",
    header: ({ column }) => <SortableHeader column={column}>N°</SortableHeader>,
  },
  {
    accessorKey: "fecha",
    header: ({ column }) => (
      <SortableHeader column={column}>Fecha</SortableHeader>
    ),
  },
  { accessorKey: "tipoApp", header: "Tipo" },
  { accessorKey: "fenologico", header: "Fenológico" },
  {
    id: "panos",
    header: "Paños",
    cell: ({ row }) => row.original.panoIds.length,
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => (
      <Badge variant={variantePorEstado(row.original.estado)}>
        {row.original.estado}
      </Badge>
    ),
  },
  {
    id: "acciones",
    header: "",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <OrdenDetalle orden={row.original} />
        {puedeConfirmar && <OrdenConfirmar orden={row.original} />}
        {puedeEditar && (
          <OrdenForm orden={row.original} panos={panos} catalogo={catalogo} />
        )}
        {puedeEditar && <OrdenDelete orden={row.original} />}
      </div>
    ),
  },
]
