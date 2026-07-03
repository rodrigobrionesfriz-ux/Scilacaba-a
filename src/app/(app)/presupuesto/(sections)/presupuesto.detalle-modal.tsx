"use client"

import { useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type {
  DetalleGastoItem,
  Moneda,
} from "@/types/presupuesto.types"
import { formatCLP, formatUSD } from "@/utils/money.utils"

type PresupuestoDetalleModalProps = {
  descripcion: string | null
  items: DetalleGastoItem[]
  ppto: number
  moneda: Moneda
  tc: number | null
  onOpenChange: (open: boolean) => void
}

// Modal Detalle de Gastos (index.html:18584-18700). Los montos del detalle están
// en CLP; en modo USD se dividen por el TC. El pie muestra Gasto/Ppto/Desv%.
export const PresupuestoDetalleModal = ({
  descripcion,
  items,
  ppto,
  moneda,
  tc,
  onOpenChange,
}: PresupuestoDetalleModalProps) => {
  const [busqueda, setBusqueda] = useState("")
  const fmt = moneda === "CLP" ? formatCLP : formatUSD
  const convertir = (clp: number): number =>
    moneda === "USD" && tc ? clp / tc : clp

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase()
    return items.filter(
      (x) =>
        x.desc.toLowerCase().includes(q) ||
        x.proveedor.toLowerCase().includes(q),
    )
  }, [items, busqueda])

  const gasto = filtrados.reduce((s, x) => s + convertir(x.total), 0)
  const devPct = ppto !== 0 ? ((gasto - ppto) / Math.abs(ppto)) * 100 : null

  return (
    <Dialog open={descripcion != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>{descripcion}</DialogTitle>
          <DialogDescription>
            {items.length} registros · Hoja Detalle Gastos
          </DialogDescription>
        </DialogHeader>

        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar descripción o proveedor…"
          className="w-full"
        />

        <div className="max-h-[45vh] overflow-y-auto">
          {filtrados.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin registros en Detalle Gastos para esta descripción.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((x, i) => {
                  const v = convertir(x.total)
                  return (
                    <TableRow key={`${x.desc}-${x.mes}-${i}`}>
                      <TableCell
                        className="max-w-[18rem] truncate"
                        title={x.desc}
                      >
                        {x.desc}
                      </TableCell>
                      <TableCell
                        className="max-w-[12rem] truncate text-muted-foreground"
                        title={x.proveedor}
                      >
                        {x.proveedor}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {x.mes}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right",
                          v < 0 && "text-red-600 dark:text-red-500",
                        )}
                      >
                        {fmt(v)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 border-t pt-3 text-sm">
          <span>
            Gasto: <strong>{fmt(gasto)}</strong>
          </span>
          <span className="text-muted-foreground">
            Ppto: <strong>{fmt(ppto)}</strong>
          </span>
          <span
            className={cn(
              devPct != null &&
                (devPct > 0
                  ? "text-red-600 dark:text-red-500"
                  : "text-emerald-600 dark:text-emerald-500"),
            )}
          >
            Desv:{" "}
            <strong>
              {devPct == null
                ? "s/ppto"
                : `${devPct > 0 ? "+" : ""}${devPct.toFixed(1)}%`}
            </strong>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
