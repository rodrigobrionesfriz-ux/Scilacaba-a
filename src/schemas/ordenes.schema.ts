import { z } from "zod"
import {
  ESTADOS_FENOLOGICOS,
  TIPOS_APP,
  UNIDADES_ORDEN,
} from "@/constants/cuaderno.constants"

// Un producto de la mezcla de una OA. La dosis debe ser positiva para repartirse.
export const productoOrdenSchema = z.object({
  nombre: z.string().trim().min(1, "El producto es obligatorio"),
  dosis: z.coerce
    .number({ message: "Dosis inválida" })
    .positive("La dosis debe ser mayor que 0"),
  unidad: z.enum(UNIDADES_ORDEN),
})

export const ordenSchema = z.object({
  fecha: z.string().trim().min(1, "La fecha es obligatoria"),
  tipoApp: z.enum(TIPOS_APP, { message: "Selecciona el tipo de aplicación" }),
  fenologico: z.enum(ESTADOS_FENOLOGICOS, {
    message: "Selecciona el estado fenológico",
  }),
  objetivos: z.array(z.string().trim().min(1)).default([]),
  objetivoOtro: z.string().trim().default(""),
  especie: z.string().trim().default(""),
  responsable: z.string().trim().default(""),
  metodo: z.string().trim().default(""),
  panoIds: z
    .array(z.string().trim().min(1))
    .min(1, "Selecciona al menos un paño"),
  productos: z
    .array(productoOrdenSchema)
    .min(1, "Agrega al menos un producto"),
  moj: z.coerce.number({ message: "Mojamiento inválido" }).min(0).default(0),
  vha: z.coerce
    .number({ message: "Pasadas inválidas" })
    .min(1, "Mínimo 1 pasada")
    .default(1),
  notas: z.string().trim().default(""),
})

export type Orden = z.infer<typeof ordenSchema>
export type ProductoOrdenInput = z.infer<typeof productoOrdenSchema>
