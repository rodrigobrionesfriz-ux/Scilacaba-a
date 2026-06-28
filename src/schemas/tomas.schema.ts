import { z } from "zod"
import { ALCANCE_CON_STOCK, ALCANCE_TODOS } from "@/constants/tomas.constants"

// Inicio de una toma: bodega + filtros opcionales + alcance. La lista de líneas
// teóricas la arma el server (getStockParaToma), no el cliente.
export const iniciarTomaSchema = z.object({
  bodegaId: z.string().trim().min(1, "Selecciona la bodega"),
  filtroGrupo: z.string().trim().default(""),
  filtroTipo: z.string().trim().default(""),
  alcance: z.enum([ALCANCE_CON_STOCK, ALCANCE_TODOS]),
  observaciones: z.string().trim().default(""),
})

// Conteo físico de una línea. fisico es nullable (sin ingresar = null);
// fisicoIngresado marca si el operador escribió un valor.
export const conteoLineaSchema = z.object({
  id: z.number().int(),
  fisico: z.number().nullable(),
  fisicoIngresado: z.boolean(),
})

// Guardar/cerrar el conteo: el countId + el estado de todas sus líneas.
export const capturarTomaSchema = z.object({
  countId: z.string().trim().min(1),
  lineas: z.array(conteoLineaSchema),
})

// Devolver o rechazar: exigen motivo no vacío (lo escribe el autorizador).
export const motivoTomaSchema = z.object({
  countId: z.string().trim().min(1),
  motivo: z.string().trim().min(1, "Indica el motivo"),
})

export type IniciarToma = z.infer<typeof iniciarTomaSchema>
export type ConteoLinea = z.infer<typeof conteoLineaSchema>
export type CapturarToma = z.infer<typeof capturarTomaSchema>
export type MotivoToma = z.infer<typeof motivoTomaSchema>
