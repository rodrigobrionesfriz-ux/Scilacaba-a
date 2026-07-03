"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { COLOR_PPTO, COLOR_REAL } from "@/constants/presupuesto.constants"
import type { Moneda, SerieCategoria } from "@/types/presupuesto.types"
import { formatCLP, formatUSD } from "@/utils/money.utils"

const config = {
  ppto: { label: "Presupuesto", color: COLOR_PPTO },
  real: { label: "Real", color: COLOR_REAL },
} satisfies ChartConfig

// Presupuesto vs Real por tipo de costo (index.html:19356).
export const PresupuestoChartTipo = ({
  datos,
  moneda,
}: {
  datos: SerieCategoria[]
  moneda: Moneda
}) => {
  const fmt = moneda === "CLP" ? formatCLP : formatUSD
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Por tipo de costo</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[280px] w-full">
          <BarChart data={datos} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              width={64}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => fmt(Number(v))}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent formatter={(v) => fmt(Number(v))} />
              }
            />
            <Bar dataKey="ppto" fill="var(--color-ppto)" radius={4} />
            <Bar dataKey="real" fill="var(--color-real)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
