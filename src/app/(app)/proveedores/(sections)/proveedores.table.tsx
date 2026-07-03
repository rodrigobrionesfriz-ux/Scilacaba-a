"use client"

import { buildEntidadComercialColumns } from "@/components/entidad-comercial-columns"
import { DataTable } from "@/components/ui/data-table"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import { ExportarExcel } from "@/components/ui/exportar-excel"
import type { Proveedor } from "@/schemas/proveedores.schema"
import { exportarProveedoresExcel } from "@/server/proveedores/proveedores.actions"
import { ProveedorForm } from "./proveedores.form"

type ProveedoresTableProps = {
  proveedores: Proveedor[]
  puedeCrear: boolean
}

export const ProveedoresTable = ({
  proveedores,
  puedeCrear,
}: ProveedoresTableProps) => {
  const columns = buildEntidadComercialColumns({
    puedeEditar: puedeCrear,
    renderEditar: (e) => <ProveedorForm proveedor={e} />,
  })

  return (
    <DataTable
      columns={columns}
      data={proveedores}
      toolbar={(table) => (
        <DataTableToolbar
          table={table}
          placeholder="Buscar código, razón social o giro…"
          acciones={<ExportarExcel action={exportarProveedoresExcel} />}
          nuevo={puedeCrear && <ProveedorForm />}
        />
      )}
    />
  )
}
