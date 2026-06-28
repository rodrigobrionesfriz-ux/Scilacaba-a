"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import type { AplicacionRow } from "@/types/aplicaciones.types"
import { AplicacionDelete } from "./aplicaciones.delete"
import { AplicacionForm } from "./aplicaciones.form"

type Opcion = { value: string; label: string }

type ColumnasOpts = {
  panos: Opcion[]
  productos: string[]
  puedeEditar: boolean
}

export const buildAplicacionesColumns = ({
  panos,
  productos,
  puedeEditar,
}: ColumnasOpts): ColumnDef<AplicacionRow>[] => [
  {
    accessorKey: "fecha",
    header: ({ column }) => (
      <SortableHeader column={column}>Fecha</SortableHeader>
    ),
  },
  {
    accessorKey: "panoNombre",
    header: ({ column }) => <SortableHeader column={column}>Paño</SortableHeader>,
    cell: ({ row }) => row.original.panoNombre || "—",
  },
  { accessorKey: "tipo", header: "Tipo" },
  {
    accessorKey: "producto",
    header: ({ column }) => (
      <SortableHeader column={column}>Producto</SortableHeader>
    ),
  },
  {
    id: "dosis",
    header: "Dosis",
    accessorFn: (r) => [r.dosis, r.unidad].filter(Boolean).join(" "),
  },
  { accessorKey: "metodo", header: "Método" },
  { accessorKey: "operador", header: "Operador" },
  { accessorKey: "lote", header: "Lote" },
  {
    id: "acciones",
    header: "",
    enableSorting: false,
    cell: ({ row }) =>
      puedeEditar ? (
        <div className="flex justify-end gap-1">
          <AplicacionForm
            aplicacion={row.original}
            panos={panos}
            productos={productos}
          />
          <AplicacionDelete aplicacion={row.original} />
        </div>
      ) : null,
  },
]
