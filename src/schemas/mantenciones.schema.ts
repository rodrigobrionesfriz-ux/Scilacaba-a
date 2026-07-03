import { z } from "zod"
import {
  MANT_CATEGORIAS,
  MANT_TIPOS_DETALLE,
  TIPOS_DOC_FACTURA,
} from "@/constants/mantenciones.constants"

// Línea de detalle de una OT. tipo obligatorio; producto/detalle opcionales
// (p.ej. "Mano de obra" no lleva producto).
export const lineaOtSchema = z.object({
  tipo: z.enum(MANT_TIPOS_DETALLE),
  productoCodigo: z.string().trim().default(""),
  productoNombre: z.string().trim().default(""),
  detalle: z.string().trim().default(""),
  cantidad: z.number().min(0, "La cantidad no puede ser negativa").default(1),
  valorUnit: z.number().min(0, "El valor unitario no puede ser negativo").default(0),
})
export type LineaOt = z.infer<typeof lineaOtSchema>

// Orden de trabajo (crear/editar). `id` presente = edición (upsert por id).
export const ordenTrabajoSchema = z.object({
  id: z.string().trim().optional(),
  fecha: z.string().min(1, "La fecha es obligatoria"),
  categoria: z.enum(MANT_CATEGORIAS),
  activo: z.string().trim().default(""),
  descripcion: z.string().trim().default(""),
  proveedorCodigo: z.string().trim().default(""),
  lineas: z.array(lineaOtSchema).default([]),
})
export type OrdenTrabajo = z.infer<typeof ordenTrabajoSchema>

// Registrar factura de una OT.
export const facturaSchema = z.object({
  otId: z.string().min(1),
  tipoDoc: z.enum(TIPOS_DOC_FACTURA),
  numeroDoc: z.string().trim().min(1, "El número de documento es obligatorio"),
  fecha: z.string().min(1, "La fecha es obligatoria"),
  monto: z.number().min(0, "El monto no puede ser negativo"),
  horometro: z.number().min(0, "El horómetro no puede ser negativo").nullable().default(null),
  obs: z.string().trim().default(""),
})
export type FacturaInput = z.infer<typeof facturaSchema>

// Identificador de OT para acciones puntuales (eliminar OT/factura, exportar).
export const otIdSchema = z.object({ id: z.string().min(1) })
export type OtIdInput = z.infer<typeof otIdSchema>
