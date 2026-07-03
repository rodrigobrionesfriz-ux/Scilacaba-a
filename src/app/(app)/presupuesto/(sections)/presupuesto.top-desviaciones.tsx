"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { FilaDesviacion, Moneda } from "@/types/presupuesto.types"
import { formatCLP, formatUSD } from "@/utils/money.utils"

// Top desviaciones por magnitud (index.html:19857). Clic en fila → detalle.
export const PresupuestoTopDesviaciones = ({
  filas,
  moneda,
  onSelect,
}: {
  filas: FilaDesviacion[]
  moneda: Moneda
  onSelect: (descripcion: string) => void
}) => {
  const fmt = moneda === "CLP" ? formatCLP : formatUSD
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top desviaciones</CardTitle>
      </CardHeader>
      <CardContent>
        {filas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin desviaciones.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Desviación</TableHead>
                <TableHead className="text-right">% vs ppto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((f) => {
                const sobre = f.dev > 0
                return (
                  <TableRow
                    key={f.label}
                    className="cursor-pointer"
                    onClick={() => onSelect(f.label)}
                    title={`Presupuesto: ${fmt(f.ppto)} · Real: ${fmt(f.real)} — Clic para ver el detalle`}
                  >
                    <TableCell className="max-w-[16rem] truncate">
                      {f.label}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium",
                        sobre
                          ? "text-red-600 dark:text-red-500"
                          : "text-emerald-600 dark:text-emerald-500",
                      )}
                    >
                      {sobre ? "▲ +" : "▼ "}
                      {fmt(f.dev)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {f.devPct == null
                        ? "—"
                        : `${f.devPct >= 0 ? "+" : ""}${f.devPct.toFixed(0)}%`}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
