import { z } from "zod"

const s = z.string().nullish()
const num = z.union([z.number(), z.string()]).nullish()
const arrS = z.array(z.string()).nullish()

// Las filas vienen con llaves con espacios/acentos (tal cual el Excel del origen).
const budgetRowSchema = z.looseObject({
  MES: s,
  AÑO: num,
  "SUB-GRUPO": s,
  "TIPO DE COSTO": s,
  DESCRIPCION: s,
  TEMPORADA: s,
  PPTO_CLP: num,
  REAL_CLP: num,
  PPTO_USD: num,
  REAL_USD: num,
  MES_ORDER: num,
})

// Envelope del payload de presupuesto/main (ya JSON.parseado)
export const presupuestoPayloadSchema = z.looseObject({
  rows: z.array(budgetRowSchema).optional(),
  detalle: z.record(z.string(), z.unknown()).nullish(),
  monthsWithReal: arrS,
  kpis: z.looseObject({ kg: num, tc: num, ha: num, kgEst: num }).nullish(),
})

export type PresupuestoPayload = z.infer<typeof presupuestoPayloadSchema>
