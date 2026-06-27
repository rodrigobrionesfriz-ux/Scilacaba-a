"use client"

import { DataTable } from "@/components/ui/data-table"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import type { Group, ProductType } from "@/types/catalogos.types"
import type { ProductoRow } from "@/types/productos.types"
import { buildProductosColumns } from "./productos.columns"
import { ProductoForm } from "./productos.form"

type ProductosTableProps = {
  productos: ProductoRow[]
  tipos: ProductType[]
  grupos: Group[]
  puedeCrear: boolean
  puedeEliminar: boolean
}

export const ProductosTable = ({
  productos,
  tipos,
  grupos,
  puedeCrear,
  puedeEliminar,
}: ProductosTableProps) => {
  const columns = buildProductosColumns({
    tipos,
    grupos,
    puedeEditar: puedeCrear,
    puedeEliminar,
  })

  return (
    <DataTable
      columns={columns}
      data={productos}
      toolbar={(table) => (
        <DataTableToolbar
          table={table}
          placeholder="Buscar código, EAN o descripción…"
          nuevo={puedeCrear && <ProductoForm tipos={tipos} grupos={grupos} />}
        />
      )}
    />
  )
}
