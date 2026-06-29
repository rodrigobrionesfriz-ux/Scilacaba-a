import { z } from "zod"
import { TIPOS_ARBOL } from "@/constants/terreno.constants"

// Validación del módulo de Conteos (regla 13). Importa solo tipos/constantes.
// El conteo se captura offline (Dexie) y se valida al sincronizar a Postgres.

export const arbolSchema = z.object({
  n: z.number().int().min(1),
  centros: z.number().int().min(0),
  tipo: z.enum(TIPOS_ARBOL),
  codigo: z.string().min(1),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  precision: z.number().nullable(),
  fecha: z.string().min(1),
})

export const conteoSchema = z.object({
  id: z.string().min(1),
  panoId: z.number().int().nullable(),
  panoNombre: z.string(),
  variedad: z.string(),
  especie: z.string(),
  etapa: z.string(),
  fijosCodigos: z.array(z.string()),
  usuario: z.string(),
  arboles: z.array(arbolSchema).min(1, "El conteo debe tener al menos un árbol"),
  promedioCentros: z.number().min(0),
  nArboles: z.number().int().min(0),
  fechaInicio: z.string().min(1),
  fechaFin: z.string().nullable(),
})

// Payload de subida ("Subir a la nube"): un lote de conteos pendientes.
export const sincronizarConteosSchema = z
  .array(conteoSchema)
  .min(1, "No hay conteos para sincronizar")

export type ConteoInput = z.infer<typeof conteoSchema>
