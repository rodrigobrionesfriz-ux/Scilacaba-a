import { z } from "zod"

// Input del formulario de Centro de Costo (regla 13). El código se normaliza
// (uppercase, espacios→"-") en el form; aquí se valida el formato resultante.
export const centroCostoSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, "El código es obligatorio")
    .regex(/^[A-Z0-9_.-]+$/, "Solo letras, números, guiones y puntos"),
  descripcion: z.string().trim().min(1, "La descripción es obligatoria"),
  area: z.string().trim().min(1, "El área es obligatoria"),
  responsable: z.string().trim().default(""),
  observaciones: z.string().trim().default(""),
  activo: z.boolean().default(true),
})

export type CentroCosto = z.infer<typeof centroCostoSchema>
