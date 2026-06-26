import { z } from "zod"

export const dashboardStatsSchema = z.object({
  totalProductos: z.number().int().nonnegative(),
  totalBodegas: z.number().int().nonnegative(),
  valorInventario: z.number().nonnegative(),
})
