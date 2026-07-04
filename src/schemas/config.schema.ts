import { z } from "zod"
import type { Empresa, IndicadorFila } from "@/types/config.types"

// Datos de la empresa (blob config.empresa, index.html:9155). El RUT se valida
// aparte en la action con rutValido (los schemas no importan utils — boundaries).
export const empresaSchema: z.ZodType<Empresa> = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  rut: z.string().trim().default(""),
  direccion: z.string().trim().default(""),
  giro: z.string().trim().default(""),
  telefono: z.string().trim().default(""),
  correo: z
    .string()
    .trim()
    .default("")
    .refine(
      (v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "El correo no tiene un formato válido",
    ),
  logo: z.string().default(""),
  recupIEC: z.boolean().default(false),
})

// Tipo de producto (store product_types, PK natural nombre en mayúsculas).
export const tipoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .transform((s) => s.toUpperCase()),
  descripcion: z.string().trim().default(""),
  activo: z.boolean().default(true),
})
export type TipoInput = z.infer<typeof tipoSchema>

// Grupo con sus subgrupos (store groups). Los subgrupos llegan ya normalizados
// (mayúsculas, sin duplicados) desde el form vía normalizarSubgrupos.
export const grupoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .transform((s) => s.toUpperCase()),
  subgrupos: z.array(z.string()).default([]),
})
export type GrupoInput = z.infer<typeof grupoSchema>

// Guardado de indicadores de una temporada: una fila por mes (valores nulos =
// sin dato). La action arma el objeto meses omitiendo los null.
export const indicadorFilaSchema: z.ZodType<IndicadorFila> = z.object({
  mes: z.string().min(1),
  usd: z.number().nullable(),
  utm: z.number().nullable(),
  uf: z.number().nullable(),
})

export const guardarIndicadoresSchema = z.object({
  temporada: z.string().min(1, "Temporada requerida"),
  filas: z.array(indicadorFilaSchema),
})
export type GuardarIndicadoresInput = z.infer<typeof guardarIndicadoresSchema>
