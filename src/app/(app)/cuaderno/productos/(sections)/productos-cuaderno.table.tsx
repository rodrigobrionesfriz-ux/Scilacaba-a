"use client"

import { DataTable } from "@/components/ui/data-table"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import type { ProductoCuadernoRow } from "@/types/productos-cuaderno.types"
import { buildProductosCuadernoColumns } from "./productos-cuaderno.columns"
import { ProductoCuadernoForm } from "./productos-cuaderno.form"

type ProductosCuadernoTableProps = {
  productos: ProductoCuadernoRow[]
  puedeEditar: boolean
}

export const ProductosCuadernoTable = ({
  productos,
  puedeEditar,
}: ProductosCuadernoTableProps) => {
  const columns = buildProductosCuadernoColumns({ puedeEditar })

  return (
    <DataTable
      columns={columns}
      data={productos}
      emptyMessage="Sin productos en el catálogo."
      toolbar={(table) => (
        <DataTableToolbar
          table={table}
          placeholder="Buscar por nombre, tipo u objetivo…"
          mostrarEstado={false}
          nuevo={puedeEditar && <ProductoCuadernoForm />}
        />
      )}
    />
  )
}
