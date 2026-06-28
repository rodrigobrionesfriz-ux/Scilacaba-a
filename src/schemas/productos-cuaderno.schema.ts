import { z } from "zod"

// Input del catálogo de productos del cuaderno (field_products, regla 13).
// PK = `nombre` (lo ingresa el usuario al crear, readonly tras crear). `aportes`
// (jsonb N-P-K) no se edita en 6a; se preserva al actualizar.
export const productoCuadernoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  tipo: z.string().trim().default(""),
  unidad: z.string().trim().default(""),
  dosis: z.string().trim().default(""),
  ingredienteActivo: z.string().trim().default(""),
  objetivo: z.string().trim().default(""),
})

export type ProductoCuaderno = z.infer<typeof productoCuadernoSchema>
