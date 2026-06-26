import { dashboardStatsSchema } from "@/schemas/dashboard.schema"
import type { DashboardStats } from "@/types/dashboard.types"

// Placeholder de Fase 0: en Fase 1+ leerá de la base de datos (Drizzle).
export const getDashboardStats = async (): Promise<DashboardStats> =>
  dashboardStatsSchema.parse({
    totalProductos: 0,
    totalBodegas: 0,
    valorInventario: 0,
  })
