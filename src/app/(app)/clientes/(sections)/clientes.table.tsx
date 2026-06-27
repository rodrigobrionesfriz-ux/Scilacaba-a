"use client"

import { buildEntidadComercialColumns } from "@/components/entidad-comercial-columns"
import { DataTable } from "@/components/ui/data-table"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import type { Cliente } from "@/schemas/clientes.schema"
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
          nuevo={puedeCrear && <ClienteForm />}
        />
      )}
    />
  )
}
