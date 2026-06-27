import { z } from "zod"

// Forma común de proveedores y clientes (misma tabla en el monolito). El código es
// el RUT sin DV (6 a 9 dígitos). El DV del campo `rut` se valida en la action (DV
// módulo 11): boundaries impide que un schema importe utils.
export const entidadComercialSchema = z.object({
  codigo: z
    .string()
    .trim()
    .regex(/^\d{6,9}$/, "El código es el RUT sin DV (6 a 9 dígitos)"),
  razonSocial: z.string().trim().min(1, "La razón social es obligatoria"),
  rut: z.string().trim().default(""),
  giro: z.string().trim().default(""),
  direccion: z.string().trim().default(""),
  comuna: z.string().trim().default(""),
  ciudad: z.string().trim().default(""),
  telefono: z.string().trim().default(""),
  email: z
    .string()
    .trim()
    .default("")
    .refine(
      (v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),
      "Email inválido",
    ),
  contacto: z.string().trim().default(""),
  activo: z.boolean().default(true),
})

export type EntidadComercial = z.infer<typeof entidadComercialSchema>
