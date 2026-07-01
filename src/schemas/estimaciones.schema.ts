import { z } from "zod"

// Validación de Estimación de cosecha (regla 13). Módulo online: valida al
// guardar/eliminar una versión (no hay captura offline).

// Pesos de producción por estado (%), uno por cada valor de EstadoPlanta.
export const pesosEstadoSchema = z.object({
  sano: z.number().min(0),
  debil: z.number().min(0),
  muerto: z.number().min(0),
  replante: z.number().min(0),
  falta: z.number().min(0),
})

// Desglose crudo de plantas por estado (invplantas). null si el paño no tiene
// hileras registradas.
export const desgloseEstadosSchema = z
  .object({
    sano: z.number().int().min(0),
    debil: z.number().int().min(0),
    muerto: z.number().int().min(0),
    replante: z.number().int().min(0),
    falta: z.number().int().min(0),
  })
  .nullable()

export const lineaEstimacionSchema = z.object({
  panoId: z.number().int(),
  panoNombre: z.string(),
  variedad: z.string(),
  centros: z.number().min(0),
  frutosCentro: z.number().min(0),
  kgFruto: z.number().min(0),
  plantas: z.number().int().min(0),
  desglose: desgloseEstadosSchema,
  plantasEquiv: z.number().min(0).nullable(),
  plantasInvTotal: z.number().int().min(0).nullable(),
  usarEquiv: z.boolean(),
  pesosEstado: pesosEstadoSchema,
})

export const guardarEstimacionSchema = z.object({
  id: z.string().min(1).optional(),
  nombre: z.string().min(1, "El nombre de la estimación es obligatorio"),
  lineas: z
    .array(lineaEstimacionSchema)
    .min(1, "La estimación debe tener al menos una línea"),
})

export const eliminarEstimacionSchema = z.object({
  id: z.string().min(1),
})

export type PesosEstadoInput = z.infer<typeof pesosEstadoSchema>
export type LineaEstimacionInput = z.infer<typeof lineaEstimacionSchema>
export type GuardarEstimacionInput = z.infer<typeof guardarEstimacionSchema>
