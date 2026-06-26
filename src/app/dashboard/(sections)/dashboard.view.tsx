import { Button } from "@/components/ui/button"
import {
  DASHBOARD_SUBTITLE,
  DASHBOARD_TITLE,
} from "@/constants/dashboard.constants"
import { getDashboardStats } from "@/server/dashboard/dashboard.queries"
import { formatCLP } from "@/utils/money.utils"

export const DashboardView = async () => {
  const stats = await getDashboardStats()

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">{DASHBOARD_TITLE}</h1>
      <p className="mt-2 text-muted-foreground">{DASHBOARD_SUBTITLE}</p>
      <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Productos</dt>
          <dd className="text-lg font-semibold">{stats.totalProductos}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Bodegas</dt>
          <dd className="text-lg font-semibold">{stats.totalBodegas}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Valor inventario</dt>
          <dd className="text-lg font-semibold">
            {formatCLP(stats.valorInventario)}
          </dd>
        </div>
      </dl>
      <Button className="mt-4">OK</Button>
    </main>
  )
}
