"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import { FR_NUTRIENTES } from "@/constants/fertirriego.constants"
import type { ProductoFertRow } from "@/types/fertirriego.types"
import { AportesForm } from "./aportes.form"

const resumenAportes = (row: ProductoFertRow): string =>
  FR_NUTRIENTES.filter((nu) => (row.aportes[nu] ?? 0) > 0)
    .map((nu) => `${nu} ${row.aportes[nu]}`)
    .join(" · ")

export const buildAportesColumns = ({
  puedeEditar,
}: {
  puedeEditar: boolean
}): ColumnDef<ProductoFertRow>[] => [
  {
    accessorKey: "nombre",
    header: ({ column }) => (
      <SortableHeader column={column}>Producto</SortableHeader>
    ),
  },
  { accessorKey: "tipo", header: "Tipo" },
  { accessorKey: "unidad", header: "Unidad" },
  {
    id: "aportes",
    header: "Composición (% elemental)",
    cell: ({ row }) => resumenAportes(row.original) || "—",
  },
  {
    id: "acciones",
    header: "",
    enableSorting: false,
    cell: ({ row }) =>
      puedeEditar ? (
        <div className="flex justify-end">
          <AportesForm producto={row.original} />
        </div>
      ) : null,
  },
]
