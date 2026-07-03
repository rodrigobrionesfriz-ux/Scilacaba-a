"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db/client"
import { warehouses } from "@/db/schema"
import { construirExcel } from "@/lib/xlsx"
import { type Bodega, bodegaSchema } from "@/schemas/bodegas.schema"
import { requirePermiso } from "@/server/auth/auth.queries"
import { getBodegas } from "@/server/bodegas/bodegas.queries"
import type { ActionResult } from "@/types/action.types"
import type { ExportResult } from "@/types/export.types"

const aColumnas = (data: Bodega) => ({
  nombre: data.nombre,
  direccion: data.direccion || null,
  esServicios: data.esServicios,
  activo: data.activo,
})

export const crearBodega = async (input: unknown): Promise<ActionResult> => {
  await requirePermiso("bodegas.crear")
  const parsed = bodegaSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const data = parsed.data
  const existe = await db.query.warehouses.findFirst({
    where: eq(warehouses.id, data.id),
  })
  if (existe) return { ok: false, error: "Ya existe una bodega con ese ID" }
  await db.insert(warehouses).values({ id: data.id, ...aColumnas(data) })
  revalidatePath("/bodegas")
  return { ok: true }
}

export const editarBodega = async (
  id: string,
  input: unknown,
): Promise<ActionResult> => {
  await requirePermiso("bodegas.crear")
  const parsed = bodegaSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  await db.update(warehouses).set(aColumnas(parsed.data)).where(eq(warehouses.id, id))
  revalidatePath("/bodegas")
  return { ok: true }
}

// Exporta las bodegas a Excel (generado en el servidor, SPEC).
export const exportarBodegasExcel = async (): Promise<ExportResult> => {
  await requirePermiso("bodegas.ver")
  const bodegas = await getBodegas()
  const base64 = await construirExcel([
    {
      nombre: "Bodegas",
      columnas: [
        { header: "ID", key: "id", width: 14 },
        { header: "Nombre", key: "nombre", width: 30 },
        { header: "Dirección", key: "direccion", width: 36 },
        { header: "Servicios", key: "esServicios", width: 12 },
        { header: "Activo", key: "activo", width: 10 },
      ],
      filas: bodegas.map((b) => ({
        ...b,
        esServicios: b.esServicios ? "Sí" : "No",
        activo: b.activo ? "Sí" : "No",
      })),
    },
  ])
  return { ok: true, base64, filename: "bodegas.xlsx" }
}
