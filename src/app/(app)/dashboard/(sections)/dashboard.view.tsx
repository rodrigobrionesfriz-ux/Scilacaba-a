import {
  DASHBOARD_SUBTITLE,
  DASHBOARD_TITLE,
} from "@/constants/dashboard.constants"
import { getUsuarioActual } from "@/server/auth/auth.queries"
import { getDashboardStats } from "@/server/dashboard/dashboard.queries"
import { can } from "@/utils/permisos.utils"
import { DashboardAcciones } from "./dashboard.acciones"
import { DashboardCompraUrgenteBanner } from "./dashboard.compra-urgente-banner"
import { DashboardKpis } from "./dashboard.kpis"
import { DashboardMovimientosRecientes } from "./dashboard.movimientos-recientes"
import { DashboardStockBajo } from "./dashboard.stock-bajo"

export const DashboardView = async () => {
  const [stats, usuario] = await Promise.all([
    getDashboardStats(),
    getUsuarioActual(),
  ])

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 p-8">
      <div>
        <h1 className="text-2xl font-bold">{DASHBOARD_TITLE}</h1>
        <p className="mt-2 text-muted-foreground">{DASHBOARD_SUBTITLE}</p>
      </div>

      <DashboardCompraUrgenteBanner count={stats.comprasUrgentesCount} />

      <DashboardKpis
        totalProductos={stats.totalProductos}
        totalBodegas={stats.totalBodegas}
        valorInventario={stats.valorInventario}
        valorServicios={stats.valorServicios}
        totalMovimientos={stats.totalMovimientos}
        stockBajoCount={stats.stockBajoCount}
        porVencerCount={stats.porVencerCount}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardMovimientosRecientes
            movimientos={stats.movimientosRecientes}
          />
        </div>
        <DashboardAcciones
          puedeMovimientos={can(usuario, "movimientos.crear")}
          puedeProductos={can(usuario, "productos.crear")}
        />
      </div>

      <DashboardStockBajo filas={stats.stockBajo} />
    </main>
  )
}
