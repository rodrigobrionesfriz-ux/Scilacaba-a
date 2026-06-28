"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { MovimientoRow } from "@/types/movimientos.types"
import { buildMovimientosColumns } from "./movimientos.columns"

type MovimientosTableProps = {
  movimientos: MovimientoRow[]
  puedeCrear: boolean
  puedeAnular: boolean
}

export const MovimientosTable = ({
  movimientos,
  puedeCrear,
  puedeAnular,
}: MovimientosTableProps) => {
  const columns = buildMovimientosColumns({ puedeAnular })
  const [busqueda, setBusqueda] = useState("")
  const [direccion, setDireccion] = useState("todas")
  const direccionItems = [
    { value: "todas", label: "Todas" },
    { value: "ENT", label: "Entradas" },
    { value: "SAL", label: "Salidas" },
  ]

  return (
    <DataTable
      columns={columns}
      data={movimientos}
      emptyMessage="Sin movimientos registrados."
      toolbar={(table) => (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                table.setGlobalFilter(e.target.value)
              }}
              placeholder="Buscar número, bodega, contraparte…"
              className="w-72"
            />
            <Select
              items={direccionItems}
              value={direccion}
              onValueChange={(v) => {
                const val = v ?? "todas"
                setDireccion(val)
                table
                  .getColumn("direccion")
                  ?.setFilterValue(val === "todas" ? undefined : val)
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {direccionItems.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {puedeCrear && (
            <div className="flex gap-2">
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href="/movimientos/entradas">Nueva entrada</Link>}
              />
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href="/movimientos/salidas">Nueva salida</Link>}
              />
            </div>
          )}
        </div>
      )}
    />
  )
}
