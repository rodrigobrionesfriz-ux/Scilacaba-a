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
import type { Bodega } from "@/schemas/bodegas.schema"
import type { StockRow } from "@/types/stock.types"
import { buildStockColumns } from "./stock.columns"

type StockTableProps = {
  stock: StockRow[]
  bodegas: Bodega[]
}

export const StockTable = ({ stock, bodegas }: StockTableProps) => {
  const columns = buildStockColumns()
  const [busqueda, setBusqueda] = useState("")
  const [bodega, setBodega] = useState("todas")
  const bodegaItems = [
    { value: "todas", label: "Todas las bodegas" },
    ...bodegas.map((b) => ({ value: b.id, label: b.nombre })),
  ]

  return (
    <DataTable
      columns={columns}
      data={stock}
      emptyMessage="Sin existencias registradas."
      toolbar={(table) => (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              table.setGlobalFilter(e.target.value)
            }}
            placeholder="Buscar código o descripción…"
            className="w-72"
          />
          <Select
            items={bodegaItems}
            value={bodega}
            onValueChange={(v) => {
              const val = v ?? "todas"
              setBodega(val)
              table.getColumn("bodega")?.setFilterValue(val)
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {bodegaItems.map((b) => (
                <SelectItem key={b.value} value={b.value}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    />
  )
}
