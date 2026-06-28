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
import { TOMA_ESTADOS } from "@/constants/tomas.constants"
import type { Bodega } from "@/schemas/bodegas.schema"
import type { TomaRow } from "@/types/tomas.types"
import { buildTomasColumns } from "./tomas.columns"
import { TomaIniciar } from "./tomas.iniciar"

type TomasTableProps = {
  tomas: TomaRow[]
  puedeCrear: boolean
  bodegas: Bodega[]
  grupos: string[]
  tipos: string[]
}

export const TomasTable = ({
  tomas,
  puedeCrear,
  bodegas,
  grupos,
  tipos,
}: TomasTableProps) => {
  const columns = buildTomasColumns()
  const [busqueda, setBusqueda] = useState("")
  const [estado, setEstado] = useState("todos")
  const estadoItems = [
    { value: "todos", label: "Todos los estados" },
    ...Object.entries(TOMA_ESTADOS).map(([value, meta]) => ({
      value,
      label: meta.label,
    })),
  ]

  return (
    <DataTable
      columns={columns}
      data={tomas}
      emptyMessage="Sin tomas registradas."
      toolbar={(table) => (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                table.setGlobalFilter(e.target.value)
              }}
              placeholder="Buscar número, bodega, operador…"
              className="w-72"
            />
            <Select
              items={estadoItems}
              value={estado}
              onValueChange={(v) => {
                const val = v ?? "todos"
                setEstado(val)
                table
                  .getColumn("estado")
                  ?.setFilterValue(val === "todos" ? undefined : val)
              }}
            >
              <SelectTrigger className="w-52">
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
          </div>
          {puedeCrear && (
            <TomaIniciar bodegas={bodegas} grupos={grupos} tipos={tipos} />
          )}
        </div>
      )}
    />
  )
}
