import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { MantencionKpis } from "@/types/mantenciones.types"
import { formatCLP } from "@/utils/money.utils"

const CARDS = [
  { key: "total", label: "Total OT" },
  { key: "abiertas", label: "Abiertas" },
  { key: "facturadas", label: "Facturadas" },
] as const

export const MantencionesKpis = ({ kpis }: { kpis: MantencionKpis }) => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
    {CARDS.map((c) => (
      <Card key={c.key}>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {c.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{kpis[c.key]}</CardContent>
      </Card>
    ))}
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Monto total
        </CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold">
        {formatCLP(kpis.montoTotal)}
      </CardContent>
    </Card>
  </div>
)
