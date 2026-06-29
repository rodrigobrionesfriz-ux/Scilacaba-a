import { z } from "zod"

// Una línea de producto de una OAF. La dosis debe ser positiva. forma/horario/
// estado/unidad provienen de listas editables de la cfg → string libre (no enum).
export const lineaOafSchema = z.object({
  prod: z.string().trim().min(1, "El producto es obligatorio"),
  dosis: z.coerce
    .number({ message: "Dosis inválida" })
    .positive("La dosis debe ser mayor que 0"),
  unidad: z.string().trim().min(1, "La unidad es obligatoria"),
  obs: z.string().trim().default(""),
})

export const oafSchema = z.object({
  fecha: z.string().trim().min(1, "La fecha es obligatoria"),
  forma: z.string().trim().default(""),
  horario: z.string().trim().default(""),
  estado: z.string().trim().default(""),
  responsable: z.string().trim().default(""),
  sectores: z
    .array(z.string().trim().min(1))
    .min(1, "Selecciona al menos un sector"),
  lineas: z.array(lineaOafSchema).min(1, "Agrega al menos un producto"),
})

export type Oaf = z.infer<typeof oafSchema>
export type LineaOafInput = z.infer<typeof lineaOafSchema>
