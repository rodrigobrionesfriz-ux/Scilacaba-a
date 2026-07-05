import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardStats } from "@/types/dashboard.types"
import { formatCLP } from "@/utils/money.utils"

type DashboardKpisProps = Pick<
  DashboardStats,
  | "totalProductos"
  | "totalBodegas"
  | "valorInventario"
  | "valorServicios"
  | "totalMovimientos"
  | "stockBajoCount"
  | "porVencerCount"
>

const Kpi = ({
  label,
  valor,
  sub,
}: {
  label: string
  valor: string | number
  sub?: string
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {label}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-semibold">{valor}</div>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </CardContent>
  </Card>
)

export const DashboardKpis = ({
  totalProductos,
  totalBodegas,
  valorInventario,
  valorServicios,
  totalMovimientos,
  stockBajoCount,
  porVencerCount,
}: DashboardKpisProps) => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
    <Kpi label="Productos" valor={totalProductos} />
    <Kpi label="Bodegas" valor={totalBodegas} />
    <Kpi
      label="Valor inventario"
      valor={formatCLP(valorInventario)}
      sub={`Servicios: ${formatCLP(valorServicios)}`}
    />
    <Kpi label="Movimientos" valor={totalMovimientos} />
    <Kpi label="Stock bajo" valor={stockBajoCount} />
    <Kpi label="Por vencer" valor={porVencerCount} />
  </div>
)
