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
import { ROLE_LABELS, ROLES } from "@/constants/permisos.constants"
import type { UsuarioRow } from "@/types/usuarios.types"
import { buildUsuariosColumns } from "./usuarios.columns"

type UsuariosTableProps = {
  usuarios: UsuarioRow[]
  puedeEditar: boolean
}

export const UsuariosTable = ({ usuarios, puedeEditar }: UsuariosTableProps) => {
  const columns = buildUsuariosColumns(puedeEditar)
  const [busqueda, setBusqueda] = useState("")
  const [rol, setRol] = useState("todos")
  const rolItems = [
    { value: "todos", label: "Todos los roles" },
    ...ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] ?? r })),
  ]

  return (
    <DataTable
      columns={columns}
      data={usuarios}
      emptyMessage="Sin usuarios registrados."
      toolbar={(table) => (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              table.setGlobalFilter(e.target.value)
            }}
            placeholder="Buscar nombre o usuario…"
            className="w-64"
          />
          <Select
            items={rolItems}
            value={rol}
            onValueChange={(v) => {
              const val = v ?? "todos"
              setRol(val)
              table.getColumn("role")?.setFilterValue(val)
            }}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rolItems.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    />
  )
}
