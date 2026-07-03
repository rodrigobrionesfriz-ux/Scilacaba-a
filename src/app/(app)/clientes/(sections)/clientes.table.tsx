"use client"

import { buildEntidadComercialColumns } from "@/components/entidad-comercial-columns"
import { DataTable } from "@/components/ui/data-table"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import { ExportarExcel } from "@/components/ui/exportar-excel"
import type { Cliente } from "@/schemas/clientes.schema"
import { exportarClientesExcel } from "@/server/clientes/clientes.actions"
import { ClienteForm } from "./clientes.form"

type ClientesTableProps = {
  clientes: Cliente[]
  puedeCrear: boolean
}

export const ClientesTable = ({ clientes, puedeCrear }: ClientesTableProps) => {
  const columns = buildEntidadComercialColumns({
    puedeEditar: puedeCrear,
    renderEditar: (e) => <ClienteForm cliente={e} />,
  })

  return (
    <DataTable
      columns={columns}
      data={clientes}
      toolbar={(table) => (
        <DataTableToolbar
          table={table}
          placeholder="Buscar código, razón social o giro…"
          acciones={<ExportarExcel action={exportarClientesExcel} />}
          nuevo={puedeCrear && <ClienteForm />}
        />
      )}
    />
  )
}
