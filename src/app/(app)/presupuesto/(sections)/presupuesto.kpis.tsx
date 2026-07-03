"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { KpisPresupuesto, Moneda } from "@/types/presupuesto.types"
import { formatCLP, formatUSD } from "@/utils/money.utils"

type PresupuestoKpisProps = {
  kpis: KpisPresupuesto
  moneda: Moneda
}

const Kpi = ({
  label,
  valor,
  sub,
  tono,
}: {
  label: string
  valor: string
  sub?: string
  tono?: "sobre" | "bajo"
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {label}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div
        className={cn(
          "text-2xl font-semibold",
          tono === "sobre" && "text-red-600 dark:text-red-500",
          tono === "bajo" && "text-emerald-600 dark:text-emerald-500",
        )}
      >
        {valor}
      </div>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </CardContent>
  </Card>
)

export const PresupuestoKpis = ({ kpis, moneda }: PresupuestoKpisProps) => {
  const fmt = moneda === "CLP" ? formatCLP : formatUSD
  const sobre = kpis.dev > 0
  const signo = kpis.dev >= 0 ? "+" : "-"
  const pctSigno = kpis.devPct >= 0 ? "+" : ""

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <Kpi label="Presupuesto total" valor={fmt(kpis.ppto)} />
      <Kpi label="Real acumulado" valor={fmt(kpis.real)} />
      <Kpi
        label="Desviación"
        valor={`${signo}${fmt(Math.abs(kpis.dev))}`}
        sub={`${pctSigno}${kpis.devPct.toFixed(1)}% vs presupuesto`}
        tono={sobre ? "sobre" : "bajo"}
      />
      <Kpi label="Meses con real" valor={`${kpis.mesesReal} de 12`} />
      <Kpi
        label="Mayor sobreejecución"
        valor={kpis.maxOverrun ? fmt(kpis.maxOverrun.monto) : "—"}
        sub={kpis.maxOverrun?.label}
        tono={kpis.maxOverrun ? "sobre" : undefined}
      />
      <Kpi
        label="Avance ejecución"
        valor={kpis.avance != null ? `${kpis.avance}%` : "—"}
        sub="Real / Presupuesto"
      />
    </div>
  )
}
