import { z } from "zod"

// Configuración singleton de fertirriego (regla 13). Se serializa al blob `cfg`.
// Listas editables y datos de identificación; todo opcional con defaults vacíos.
const listaStr = z.array(z.string().trim().min(1)).default([])

export const rangoSchema = z.object({
  especie: z.string().trim().min(1, "Especie obligatoria"),
  desde: z.coerce.number().int().min(0).default(0),
  hasta: z.coerce.number().int().min(0).default(0),
})

export const predioSchema = z.object({
  predio: z.string().trim().min(1, "Predio obligatorio"),
  admin: z.string().trim().default(""),
})

export const configFertSchema = z.object({
  empresa: z.string().trim().default(""),
  temporada: z.string().trim().default(""),
  documento: z.string().trim().default(""),
  obsDefecto: z.string().trim().default(""),
  rangos: z.array(rangoSchema).default([]),
  estados: listaStr,
  condiciones: listaStr,
  equipos: listaStr,
  formas: listaStr,
  unidades: listaStr,
  horarios: listaStr,
  tiposDoc: listaStr,
  predios: z.array(predioSchema).default([]),
})

export type ConfigFertInput = z.infer<typeof configFertSchema>
