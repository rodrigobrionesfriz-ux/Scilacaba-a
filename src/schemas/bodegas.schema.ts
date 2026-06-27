import { z } from "zod"
import { BODEGA_ID_MAX } from "@/constants/bodegas.constants"

// Input del formulario de Bodega (regla 13). El `id` lo ingresa el usuario al crear
// (readonly tras crear). Soft delete vía `activo`.
export const bodegaSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "El ID es obligatorio")
    .max(BODEGA_ID_MAX, `Máximo ${BODEGA_ID_MAX} caracteres`),
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  direccion: z.string().trim().default(""),
  esServicios: z.boolean().default(false),
  activo: z.boolean().default(true),
})

export type Bodega = z.infer<typeof bodegaSchema>
