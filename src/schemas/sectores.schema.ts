import { z } from "zod"

// Input del formulario de Sector de riego (regla 13). El `id` es un uid generado
// al crear (no se pide). Numéricos opcionales: "" → null (el form los normaliza).
const numOpt = z.coerce
  .number({ message: "Debe ser un número" })
  .min(0, "No puede ser negativo")
  .nullable()
  .default(null)

export const sectorSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  equipo: z.string().trim().default(""),
  ha: numOpt,
  variedad: z.string().trim().default(""),
  plantas: z.coerce
    .number({ message: "Debe ser un número entero" })
    .int("Debe ser un número entero")
    .min(0, "No puede ser negativo")
    .nullable()
    .default(null),
})

export type Sector = z.infer<typeof sectorSchema>
