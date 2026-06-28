import { z } from "zod"
import { TURNOS_CONFIRMACION } from "@/constants/cuaderno.constants"

// Numérico opcional de condiciones ambientales: "" → null, coacciona string→number.
const numOpt = z.coerce
  .number({ message: "Debe ser un número" })
  .nullable()
  .default(null)

export const confirmacionSchema = z.object({
  ordenId: z.coerce
    .number({ message: "Orden inválida" })
    .int()
    .positive("Orden inválida"),
  fechaApp: z.string().trim().min(1, "La fecha de aplicación es obligatoria"),
  operador: z.string().trim().min(1, "El operador es obligatorio"),
  panoIds: z
    .array(z.string().trim().min(1))
    .min(1, "Selecciona al menos un paño aplicado"),
  aguaReal: z.coerce
    .number({ message: "Agua real inválida" })
    .min(0, "No puede ser negativa")
    .nullable()
    .default(null),
  horaInicio: z.string().trim().default(""),
  horaFin: z.string().trim().default(""),
  equipo: z.string().trim().default(""),
  turno: z.enum(TURNOS_CONFIRMACION).or(z.literal("")).default(""),
  tempAmb: numOpt,
  humedad: numOpt,
  viento: numOpt,
  condClima: z.string().trim().default(""),
  notas: z.string().trim().default(""),
})

export type Confirmacion = z.infer<typeof confirmacionSchema>
