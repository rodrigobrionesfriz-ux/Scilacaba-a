"use client"

import type { Table } from "@tanstack/react-table"
import { type ReactNode, useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FILTRO_ESTADO } from "@/constants/maestros.constants"

// Toolbar estándar de las tablas de maestros: buscador global + filtro por estado
// (activo) + slot para el botón "Nuevo". Reutilizable por las 5 entidades.
type DataTableToolbarProps<TData> = {
  table: Table<TData>
  placeholder?: string
  estadoColumnId?: string
  nuevo?: ReactNode
}

export const DataTableToolbar = <TData,>({
  table,
  placeholder = "Buscar…",
  estadoColumnId = "activo",
  nuevo,
}: DataTableToolbarProps<TData>) => {
  const [busqueda, setBusqueda] = useState("")
  const [estado, setEstado] = useState("todos")

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            table.setGlobalFilter(e.target.value)
          }}
          placeholder={placeholder}
          className="w-72"
        />
        <Select
          items={FILTRO_ESTADO}
          value={estado}
          onValueChange={(v) => {
            const val = v ?? "todos"
            setEstado(val)
            table
              .getColumn(estadoColumnId)
              ?.setFilterValue(val === "todos" ? undefined : val)
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTRO_ESTADO.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {nuevo}
    </div>
  )
}
