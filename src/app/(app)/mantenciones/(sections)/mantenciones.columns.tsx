"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { SortableHeader } from "@/components/ui/data-table-sortable-header"
import { OT_ESTADOS } from "@/constants/mantenciones.constants"
import type {
  MantencionDetalle,
  ProductoServicioOption,
  ProveedorOption,
} from "@/types/mantenciones.types"
import { formatCLP } from "@/utils/money.utils"
import { MantencionDelete } from "./mantenciones.delete"
import { MantencionDetalleDialog } from "./mantenciones.detalle"
import { MantencionForm } from "./mantenciones.form"
import { FacturaDelete } from "./mantenciones.factura-delete"
import { FacturaForm } from "./mantenciones.factura-form"

type ColumnasProps = {
  proveedores: ProveedorOption[]
  productos: ProductoServicioOption[]
  puedeEditar: boolean
  puedeFacturar: boolean
  puedeEliminar: boolean
}

const igual = (
  row: { getValue: (id: string) => unknown },
  id: string,
  value: unknown,
) => row.getValue(id) === value

export const buildMantencionesColumns = ({
  proveedores,
  productos,
  puedeEditar,
  puedeFacturar,
  puedeEliminar,
}: ColumnasProps): ColumnDef<MantencionDetalle>[] => [
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
  { accessorKey: "categoria", header: "Categoría", filterFn: igual },
  {
    accessorKey: "activo",
    header: "Activo",
    cell: ({ row }) => row.original.activo || "—",
  },
  {
    accessorKey: "proveedorNombre",
    header: "Proveedor",
    cell: ({ row }) => row.original.proveedorNombre || "—",
  },
  {
    accessorKey: "total",
    header: () => <div className="text-right">Total</div>,
    cell: ({ row }) => (
      <div className="text-right">{formatCLP(row.original.total)}</div>
    ),
  },
  {
    accessorKey: "estado",
    header: "Estado",
    filterFn: igual,
    cell: ({ row }) => {
      const meta = OT_ESTADOS[row.original.estado]
      return (
        <Badge variant={meta?.variant ?? "outline"}>
          {meta?.label ?? row.original.estado}
        </Badge>
      )
    },
  },
  {
    id: "acciones",
    header: "",
    enableSorting: false,
    cell: ({ row }) => {
      const ot = row.original
      const facturada = Boolean(ot.factura)
      return (
        <div className="flex justify-end gap-1">
          <MantencionDetalleDialog orden={ot} />
          {puedeFacturar && !facturada && (
            <FacturaForm orden={ot} />
          )}
          {puedeEliminar && facturada && <FacturaDelete orden={ot} />}
          {puedeEditar && (
            <MantencionForm
              orden={ot}
              proveedores={proveedores}
              productos={productos}
            />
          )}
          {puedeEliminar && <MantencionDelete orden={ot} />}
        </div>
      )
    },
  },
]
