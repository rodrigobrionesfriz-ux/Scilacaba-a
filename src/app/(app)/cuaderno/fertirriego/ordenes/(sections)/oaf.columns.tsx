"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import type {
  ConfigFert,
  OafRow,
  ProductoFertRow,
  SectorRow,
} from "@/types/fertirriego.types"
import { OafConfirmar } from "./oaf.confirmar"
import { OafDelete } from "./oaf.delete"
import { OafDetalle } from "./oaf.detalle"
import { OafForm } from "./oaf.form"

type ColumnasProps = {
  sectores: SectorRow[]
  productos: ProductoFertRow[]
  config: ConfigFert
  puedeEditar: boolean
  puedeConfirmar: boolean
}

export const buildOafColumns = ({
  sectores,
  productos,
  config,
  puedeEditar,
  puedeConfirmar,
}: ColumnasProps): ColumnDef<OafRow>[] => [
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
  { accessorKey: "forma", header: "Forma" },
  {
    id: "sectores",
    header: "Sectores",
    cell: ({ row }) => row.original.sectores.length,
  },
  {
    id: "productos",
    header: "Productos",
    cell: ({ row }) => row.original.lineas.length,
  },
  {
    id: "estado",
    header: "Estado",
    cell: ({ row }) => (
      <Badge variant={row.original.confirmada ? "default" : "outline"}>
        {row.original.confirmada ? "Confirmada" : "Pendiente"}
      </Badge>
    ),
  },
  {
    id: "acciones",
    header: "",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <OafDetalle orden={row.original} productos={productos} />
        {puedeConfirmar && <OafConfirmar orden={row.original} />}
        {puedeEditar && (
          <OafForm
            orden={row.original}
            sectores={sectores}
            productos={productos}
            config={config}
          />
        )}
        {puedeEditar && <OafDelete orden={row.original} />}
      </div>
    ),
  },
]
