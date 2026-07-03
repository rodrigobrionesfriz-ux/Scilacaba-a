"use client"

import { Cell, Pie, PieChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { COLORES_SUBGRUPO } from "@/constants/presupuesto.constants"
import type { Moneda, PuntoDonut } from "@/types/presupuesto.types"
import { formatCLP, formatUSD } from "@/utils/money.utils"

const config = { valor: { label: "Real" } } satisfies ChartConfig

// Distribución del real acumulado por sub-grupo, donut (index.html:19421).
export const PresupuestoChartSubgrupo = ({
  datos,
  moneda,
}: {
  datos: PuntoDonut[]
  moneda: Moneda
}) => {
  const fmt = moneda === "CLP" ? formatCLP : formatUSD
  const total = datos.reduce((s, d) => s + d.valor, 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Real por sub-grupo</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 sm:flex-row">
        <ChartContainer config={config} className="h-[240px] w-full sm:w-1/2">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="label"
                  formatter={(v) => fmt(Number(v))}
                />
              }
            />
            <Pie
              data={datos}
              dataKey="valor"
              nameKey="label"
              innerRadius={58}
              outerRadius={90}
              paddingAngle={2}
            >
              {datos.map((d, i) => (
                <Cell
                  key={d.label}
                  fill={COLORES_SUBGRUPO[i % COLORES_SUBGRUPO.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <ul className="flex w-full flex-col gap-2 text-sm sm:w-1/2">
          {datos.map((d, i) => {
            const pct = total ? ((d.valor / total) * 100).toFixed(1) : "0"
            return (
              <li key={d.label} className="flex items-center gap-2">
                <span
                  className="size-3 shrink-0 rounded-sm"
                  style={{
                    backgroundColor:
                      COLORES_SUBGRUPO[i % COLORES_SUBGRUPO.length],
                  }}
                />
                <span className="flex-1 truncate" title={d.label}>
                  {d.label}
                </span>
                <span className="text-muted-foreground">
                  {fmt(d.valor)} · {pct}%
                </span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
