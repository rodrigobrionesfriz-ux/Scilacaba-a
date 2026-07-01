"use server"

import ExcelJS from "exceljs"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db/client"
import { estimaciones } from "@/db/schema"
import {
  eliminarEstimacionSchema,
  guardarEstimacionSchema,
  type LineaEstimacionInput,
} from "@/schemas/estimaciones.schema"
import { requirePermiso } from "@/server/auth/auth.queries"
import type { ActionResult } from "@/types/action.types"
import type { LineaEstimacion } from "@/types/estimaciones.types"
import {
  aCajas,
  aToneladas,
  kgLinea,
  narrowLineas,
  plantasProductivas,
  plantasUsadas,
  totalKgLineas,
} from "@/utils/estimaciones.utils"

const RUTA = "/terreno/estimacion"

type ExportResult =
  | { ok: true; base64: string; filename: string }
  | { ok: false; error: string }

// Resuelve los derivados de una línea en el servidor — no se confía en el
// cálculo del cliente. plantasEquiv/plantasInvTotal se recalculan desde el
// desglose crudo (invplantas) + los pesos elegidos; plantasUsadas/kgPano desde
// esos derivados (fuente de verdad: utils, mismo patrón que conteos/invplantas).
const resolverLinea = (l: LineaEstimacionInput): LineaEstimacion => {
  const { equiv, total } = l.desglose
    ? plantasProductivas(l.desglose, l.pesosEstado)
    : { equiv: null, total: null }
  const plantasEquiv = l.desglose ? equiv : null
  const usadas = plantasUsadas({ ...l, plantasEquiv })
  return {
    ...l,
    plantasEquiv,
    plantasInvTotal: l.desglose ? total : null,
    plantasUsadas: usadas,
    kgPano: kgLinea(l.centros, l.frutosCentro, l.kgFruto, usadas),
  }
}

// Guarda una versión de estimación (nueva, o edición si viene `id`). Recalcula
// kgPano/totalKg en el servidor. Gateado por conteos.revisar (el permiso ya
// dice "revisar conteos: exportar Excel y aplicar a estimación").
export const guardarEstimacion = async (
  input: unknown,
): Promise<ActionResult> => {
  const usuario = await requirePermiso("conteos.revisar")
  const parsed = guardarEstimacionSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }

  const lineas = parsed.data.lineas.map(resolverLinea)
  const totalKg = totalKgLineas(lineas)
  const id = parsed.data.id ?? String(Date.now())
  const ahora = new Date()

  await db
    .insert(estimaciones)
    .values({
      id,
      nombre: parsed.data.nombre,
      usuario: usuario.nombre,
      lineas,
      totalKg: String(totalKg),
      fecha: ahora,
      updatedAt: ahora,
    })
    .onConflictDoUpdate({
      target: estimaciones.id,
      set: {
        nombre: parsed.data.nombre,
        lineas,
        totalKg: String(totalKg),
        updatedAt: ahora,
      },
    })

  revalidatePath(RUTA)
  return { ok: true }
}

// Elimina una versión de estimación guardada.
export const eliminarEstimacion = async (
  input: unknown,
): Promise<ActionResult> => {
  await requirePermiso("conteos.revisar")
  const parsed = eliminarEstimacionSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }

  await db.delete(estimaciones).where(eq(estimaciones.id, parsed.data.id))
  revalidatePath(RUTA)
  return { ok: true }
}

// Exporta una versión guardada a Excel (hoja Resumen + hoja Detalle),
// generado en el servidor (SPEC). El cliente decodifica el base64 a Blob.
export const exportarEstimacionExcel = async (
  input: unknown,
): Promise<ExportResult> => {
  await requirePermiso("conteos.revisar")
  const parsed = eliminarEstimacionSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }

  const fila = await db.query.estimaciones.findFirst({
    where: eq(estimaciones.id, parsed.data.id),
  })
  if (!fila) return { ok: false, error: "Estimación no encontrada" }

  const lineas: LineaEstimacion[] = narrowLineas(fila.lineas)
  const totalKg = totalKgLineas(lineas)

  const libro = new ExcelJS.Workbook()
  const resumen = libro.addWorksheet("Resumen")
  resumen.addRow(["Estimación", fila.nombre])
  resumen.addRow(["Fecha", fila.fecha.toISOString()])
  resumen.addRow(["Total kg", totalKg])
  resumen.addRow(["Cajas (5 kg)", aCajas(totalKg)])
  resumen.addRow(["Toneladas", aToneladas(totalKg)])

  const detalle = libro.addWorksheet("Detalle")
  detalle.columns = [
    { header: "Paño", key: "panoNombre", width: 24 },
    { header: "Variedad", key: "variedad", width: 16 },
    { header: "Centros florales", key: "centros", width: 16 },
    { header: "Frutos/centro", key: "frutosCentro", width: 14 },
    { header: "Kg/fruto", key: "kgFruto", width: 12 },
    { header: "N° plantas usadas", key: "plantasUsadas", width: 16 },
    { header: "Kg estimados", key: "kgPano", width: 14 },
  ]
  detalle.addRows(lineas)

  const buffer = await libro.xlsx.writeBuffer()
  const base64 = Buffer.from(buffer).toString("base64")
  const filename = `estimacion-${fila.id}.xlsx`
  return { ok: true, base64, filename }
}
