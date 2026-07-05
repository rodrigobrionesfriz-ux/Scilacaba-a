"use client"

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type Table as TanstackTable,
  useReactTable,
} from "@tanstack/react-table"
import { parseAsInteger, useQueryStates } from "nuqs"
import { type ReactNode, useState } from "react"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TAMANO_PAGINA_DEFAULT } from "@/constants/tabla.constants"

// Tabla genérica reutilizable (TanStack Table). Orden/filtro/paginación en cliente
// (datasets de maestros son chicos). El `toolbar` recibe la instancia para que cada
// entidad declare sus filtros (buscador global, filtro por activo, etc.) sin
// hardcodearlos aquí. Base para todas las tablas de dominio (productos, stock, ...).
type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  toolbar?: (table: TanstackTable<TData>) => ReactNode
  emptyMessage?: string
}

export const DataTable = <TData, TValue>({
  columns,
  data,
  toolbar,
  emptyMessage = "Sin resultados.",
}: DataTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  // Paginación en la URL (page 1-based ↔ pageIndex 0-based). shallow por defecto:
  // no hay roundtrip al server porque la paginación es en cliente.
  const [{ page, pageSize }, setPagina] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(TAMANO_PAGINA_DEFAULT),
  })

  // TanStack Table no es memoizable por el React Compiler (devuelve funciones); el
  // estado se maneja vía useState controlado, así que el skip es seguro aquí.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination: { pageIndex: page - 1, pageSize },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      const prev = { pageIndex: page - 1, pageSize }
      const next = typeof updater === "function" ? updater(prev) : updater
      setPagina({ page: next.pageIndex + 1, pageSize: next.pageSize })
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="flex flex-col gap-4">
      {toolbar?.(table)}
      <div className="rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
