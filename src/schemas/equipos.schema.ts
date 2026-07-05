import { z } from "zod"

// Input del formulario de nebulizadora (regla 13). Soft delete vía `activo`.
export const equipoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  capacidad: z.coerce
    .number({ message: "Capacidad inválida" })
    .positive("La capacidad debe ser mayor que 0"),
  activo: z.boolean().default(true),
})

export type Equipo = z.infer<typeof equipoSchema>
