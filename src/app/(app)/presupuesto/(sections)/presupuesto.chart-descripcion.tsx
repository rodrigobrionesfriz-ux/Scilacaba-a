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

// Presupuesto vs Real por descripción, top 15 (index.html:19540). Barras
// horizontales por la cantidad de ítems y lo largo de las etiquetas.
export const PresupuestoChartDescripcion = ({
  datos,
  moneda,
}: {
  datos: SerieCategoria[]
  moneda: Moneda
}) => {
  const fmt = moneda === "CLP" ? formatCLP : formatUSD
  const alto = Math.max(280, datos.length * 34)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Por descripción (top 15)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          className="w-full"
          style={{ height: alto }}
        >
          <BarChart
            data={datos}
            layout="vertical"
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => fmt(Number(v))}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={150}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent formatter={(v) => fmt(Number(v))} />
              }
            />
            <Bar dataKey="ppto" fill="var(--color-ppto)" radius={3} />
            <Bar dataKey="real" fill="var(--color-real)" radius={3} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
