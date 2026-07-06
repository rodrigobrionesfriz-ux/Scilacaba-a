"use client"

import { flexRender, type Row, type Table } from "@tanstack/react-table"
import type { ReactNode } from "react"

// Vista card del DataTable en móvil: por cada celda visible muestra label : valor.
// El label usa el `header` de la columna si es string; si es un componente (p. ej.
// SortableHeader), cae al id de la columna (evita renderizar botones dentro de la
// card y evita `as`). Las entidades que quieran labels a medida pasan `renderCard`.
type DataTableCardsProps<TData> = {
  table: Table<TData>
  renderCard?: (row: Row<TData>) => ReactNode
  emptyMessage: string
}

export const DataTableCards = <TData,>({
  table,
  renderCard,
  emptyMessage,
}: DataTableCardsProps<TData>) => {
  const rows = table.getRowModel().rows

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) =>
        renderCard ? (
          <div key={row.id} className="rounded-lg border p-3">
            {renderCard(row)}
          </div>
        ) : (
          <div
            key={row.id}
            className="flex flex-col gap-1.5 rounded-lg border p-3"
          >
            {row.getVisibleCells().map((cell) => {
              const header = cell.column.columnDef.header
              const label = typeof header === "string" ? header : cell.column.id
              return (
                <div
                  key={cell.id}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-right font-medium">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </span>
                </div>
              )
            })}
          </div>
        ),
      )}
    </div>
  )
}
