import { z } from "zod"
import { FR_NUTRIENTES } from "@/constants/fertirriego.constants"

// Composición nutricional de un producto del catálogo (blob field_products.aportes).
// `nombre` es la PK del producto (no se edita). aportes = {nutriente: %peso}.
export const aportesSchema = z.object({
  nombre: z.string().trim().min(1, "El producto es obligatorio"),
  unidad: z.string().trim().default(""),
  dosis: z.string().trim().default(""),
  aportes: z
    .partialRecord(z.enum(FR_NUTRIENTES), z.coerce.number().min(0))
    .default({}),
})

export type AportesInput = z.infer<typeof aportesSchema>
