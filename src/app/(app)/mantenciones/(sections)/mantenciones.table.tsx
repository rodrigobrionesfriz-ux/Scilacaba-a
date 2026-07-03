"use client"

import { useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MANT_CATEGORIAS,
  OT_ESTADOS,
} from "@/constants/mantenciones.constants"
import type {
  MantencionDetalle,
  ProductoServicioOption,
  ProveedorOption,
} from "@/types/mantenciones.types"
import { buildMantencionesColumns } from "./mantenciones.columns"
import { MantencionForm } from "./mantenciones.form"

type MantencionesTableProps = {
  ordenes: MantencionDetalle[]
  proveedores: ProveedorOption[]
  productos: ProductoServicioOption[]
  puedeCrear: boolean
  puedeFacturar: boolean
  puedeEliminar: boolean
}

const TODOS = "todos"

export const MantencionesTable = ({
  ordenes,
  proveedores,
  productos,
  puedeCrear,
  puedeFacturar,
  puedeEliminar,
}: MantencionesTableProps) => {
  const columns = buildMantencionesColumns({
    proveedores,
    productos,
    puedeEditar: puedeCrear,
    puedeFacturar,
    puedeEliminar,
  })
  const [busqueda, setBusqueda] = useState("")
  const [estado, setEstado] = useState(TODOS)
  const [categoria, setCategoria] = useState(TODOS)

  const estadoItems = [
    { value: TODOS, label: "Todos los estados" },
    ...Object.entries(OT_ESTADOS).map(([value, meta]) => ({
      value,
      label: meta.label,
    })),
  ]
  const categoriaItems = [
    { value: TODOS, label: "Todas las categorías" },
    ...MANT_CATEGORIAS.map((c) => ({ value: c, label: c })),
  ]

  return (
    <DataTable
      columns={columns}
      data={ordenes}
      emptyMessage="Sin órdenes de trabajo."
      toolbar={(table) => (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                table.setGlobalFilter(e.target.value)
              }}
              placeholder="Buscar número, activo, proveedor…"
              className="w-64"
            />
            <Select
              items={estadoItems}
              value={estado}
              onValueChange={(v) => {
                const val = v ?? TODOS
                setEstado(val)
                table
                  .getColumn("estado")
                  ?.setFilterValue(val === TODOS ? undefined : val)
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {estadoItems.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              items={categoriaItems}
              value={categoria}
              onValueChange={(v) => {
                const val = v ?? TODOS
                setCategoria(val)
                table
                  .getColumn("categoria")
                  ?.setFilterValue(val === TODOS ? undefined : val)
              }}
            >
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoriaItems.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {puedeCrear && (
            <MantencionForm proveedores={proveedores} productos={productos} />
          )}
        </div>
      )}
    />
  )
}
