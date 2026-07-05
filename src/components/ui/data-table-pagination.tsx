"use client"

import type { Table } from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TAMANOS_PAGINA } from "@/constants/tabla.constants"
import { rangoPaginas } from "@/utils/paginacion.utils"

// Paginación numerada del DataTable: contador de registros, selector de filas por
// página (base-ui Select) y botones primera/anterior/numeradas/siguiente/última.
// Solo llama métodos de la instancia `table` (mismo patrón que data-table-toolbar).
type DataTablePaginationProps<TData> = {
  table: Table<TData>
}

const TAMANOS_ITEMS = TAMANOS_PAGINA.map((n) => ({
  value: String(n),
  label: String(n),
}))

export const DataTablePagination = <TData,>({
  table,
}: DataTablePaginationProps<TData>) => {
  const { pageIndex, pageSize } = table.getState().pagination
  const totalPaginas = table.getPageCount()
  const totalRegistros = table.getFilteredRowModel().rows.length

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-sm text-muted-foreground">
          {totalRegistros} registro(s)
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filas por página</span>
          <Select
            items={TAMANOS_ITEMS}
            value={String(pageSize)}
            onValueChange={(v) => {
              table.setPagination({ pageIndex: 0, pageSize: Number(v) })
            }}
          >
            <SelectTrigger size="sm" className="w-18">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAMANOS_ITEMS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <span className="mr-2 text-sm text-muted-foreground">
          Página {totalPaginas === 0 ? 0 : pageIndex + 1} de {totalPaginas}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          aria-label="Primera página"
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>
        {rangoPaginas(pageIndex + 1, totalPaginas).map((item, i) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${i}`}
              className="px-2 text-sm text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === pageIndex + 1 ? "default" : "outline"}
              size="sm"
              onClick={() => table.setPageIndex(item - 1)}
              aria-label={`Página ${item}`}
              aria-current={item === pageIndex + 1 ? "page" : undefined}
            >
              {item}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Página siguiente"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.setPageIndex(totalPaginas - 1)}
          disabled={!table.getCanNextPage()}
          aria-label="Última página"
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
