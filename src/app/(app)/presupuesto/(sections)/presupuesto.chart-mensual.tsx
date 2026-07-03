"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { COLOR_PPTO, COLOR_REAL } from "@/constants/presupuesto.constants"
import type { Moneda, PuntoMensual } from "@/types/presupuesto.types"
import { formatCLP, formatUSD } from "@/utils/money.utils"

const config = {
  ppto: { label: "Presupuesto", color: COLOR_PPTO },
  real: { label: "Real", color: COLOR_REAL },
} satisfies ChartConfig

// Evolución mensual Presupuesto vs Real (index.html:19293).
export const PresupuestoChartMensual = ({
  datos,
  moneda,
}: {
  datos: PuntoMensual[]
  moneda: Moneda
}) => {
  const fmt = moneda === "CLP" ? formatCLP : formatUSD
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evolución mensual</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[280px] w-full">
          <LineChart data={datos} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="mes" tickLine={false} axisLine={false} />
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
            <Line
              dataKey="ppto"
              type="monotone"
              stroke="var(--color-ppto)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="real"
              type="monotone"
              stroke="var(--color-real)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
