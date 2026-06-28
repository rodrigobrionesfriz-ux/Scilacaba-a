import { z } from "zod"

// Input del formulario de Paño (regla 13). El `id` es epoch-ms generado al crear
// (no se pide). Numéricos opcionales: "" → null. Campos no editados en 6a
// (deh/dsh/portaInjerto/panoPadre/tipo/prodPct) se preservan al actualizar.
const numOpt = z.coerce
  .number({ message: "Debe ser un número" })
  .min(0, "No puede ser negativo")
  .nullable()
  .default(null)

export const panoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  variedad: z.string().trim().default(""),
  anio: z.string().trim().default(""),
  hectareas: numOpt,
  hasRiego: numOpt,
  densidad: numOpt,
  plantas: z.coerce
    .number({ message: "Debe ser un número entero" })
    .int("Debe ser un número entero")
    .min(0, "No puede ser negativo")
    .nullable()
    .default(null),
  color: z.string().trim().default(""),
})

export type Pano = z.infer<typeof panoSchema>
