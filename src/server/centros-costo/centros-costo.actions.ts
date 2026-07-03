"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db/client"
import { costCenters } from "@/db/schema"
import { construirExcel } from "@/lib/xlsx"
import {
  type CentroCosto,
  centroCostoSchema,
} from "@/schemas/centros-costo.schema"
import { requirePermiso } from "@/server/auth/auth.queries"
import { getCentrosCosto } from "@/server/centros-costo/centros-costo.queries"
import type { ActionResult } from "@/types/action.types"
import type { ExportResult } from "@/types/export.types"

const aColumnas = (data: CentroCosto) => ({
  descripcion: data.descripcion,
  area: data.area || null,
  responsable: data.responsable || null,
  observaciones: data.observaciones || null,
  activo: data.activo,
})

export const crearCentroCosto = async (
  input: unknown,
): Promise<ActionResult> => {
  await requirePermiso("centrosCosto.crear")
  const parsed = centroCostoSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const data = parsed.data
  const existe = await db.query.costCenters.findFirst({
    where: eq(costCenters.codigo, data.codigo),
  })
  if (existe)
    return { ok: false, error: "Ya existe un centro de costo con ese código" }
  await db.insert(costCenters).values({ codigo: data.codigo, ...aColumnas(data) })
  revalidatePath("/centros-costo")
  return { ok: true }
}

export const editarCentroCosto = async (
  codigo: string,
  input: unknown,
): Promise<ActionResult> => {
  await requirePermiso("centrosCosto.crear")
  const parsed = centroCostoSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  await db
    .update(costCenters)
    .set({ ...aColumnas(parsed.data), modificadoAt: new Date() })
    .where(eq(costCenters.codigo, codigo))
  revalidatePath("/centros-costo")
  return { ok: true }
}

// Exporta los centros de costo a Excel (generado en el servidor, SPEC).
export const exportarCentrosCostoExcel = async (): Promise<ExportResult> => {
  await requirePermiso("centrosCosto.ver")
  const centros = await getCentrosCosto()
  const base64 = await construirExcel([
    {
      nombre: "Centros de Costo",
      columnas: [
        { header: "Código", key: "codigo", width: 14 },
        { header: "Descripción", key: "descripcion", width: 32 },
        { header: "Área", key: "area", width: 22 },
        { header: "Responsable", key: "responsable", width: 24 },
        { header: "Observaciones", key: "observaciones", width: 34 },
        { header: "Activo", key: "activo", width: 10 },
      ],
      filas: centros.map((c) => ({ ...c, activo: c.activo ? "Sí" : "No" })),
    },
  ])
  return { ok: true, base64, filename: "centros-costo.xlsx" }
}
