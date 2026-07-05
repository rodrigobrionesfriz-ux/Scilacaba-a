import type { DashboardStats } from "@/types/dashboard.types"

// Placeholder temporal (Task 1): Task 2 lo reemplaza por la query real (Drizzle).
export const getDashboardStats = async (): Promise<DashboardStats> => ({
  totalProductos: 0,
  totalBodegas: 0,
  totalMovimientos: 0,
  valorInventario: 0,
  valorServicios: 0,
  stockBajoCount: 0,
  porVencerCount: 0,
  comprasUrgentesCount: 0,
  movimientosRecientes: [],
  stockBajo: [],
})
