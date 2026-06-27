"use client"

import type { Column } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

// Encabezado ordenable para columnas de DataTable. Reutilizable por todas las tablas
// de dominio. Alineado con el padding de las celdas (-ml-2.5).
export const SortableHeader = <TData,>({
  column,
  children,
}: {
  column: Column<TData, unknown>
  children: ReactNode
}) => (
  <Button
    variant="ghost"
    size="sm"
    className="-ml-2.5 h-7"
    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  >
    {children}
    <ArrowUpDown />
  </Button>
)
