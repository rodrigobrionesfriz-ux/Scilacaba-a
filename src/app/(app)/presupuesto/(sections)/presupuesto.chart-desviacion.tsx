"use client"

import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { COLOR_BAJO, COLOR_SOBRE } from "@/constants/presupuesto.constants"
import type { Moneda, PuntoDesviacion } from "@/types/presupuesto.types"
import { formatCLP, formatUSD } from "@/utils/money.utils"

const config = {
  dev: { label: "Desviación (Real − Ppto)" },
} satisfies ChartConfig

// Desviación por descripción (index.html:19653). Clic en una barra abre el
// detalle de gastos de esa descripción.
export const PresupuestoChartDesviacion = ({
  datos,
  moneda,
  onSelect,
}: {
  datos: PuntoDesviacion[]
  moneda: Moneda
  onSelect: (descripcion: string) => void
}) => {
  const fmt = moneda === "CLP" ? formatCLP : formatUSD
  const alto = Math.max(240, datos.length * 30)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Desviación por descripción</CardTitle>
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
            <Bar
              dataKey="dev"
              radius={3}
              className="cursor-pointer"
              onClick={(data: { payload?: PuntoDesviacion }) => {
                if (data.payload) onSelect(data.payload.label)
              }}
            >
              {datos.map((d) => (
                <Cell
                  key={d.label}
                  fill={d.dev > 0 ? COLOR_SOBRE : COLOR_BAJO}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
