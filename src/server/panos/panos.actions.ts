"use server"

import { arrayContains, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db/client"
import { applicationOrders, fieldRecords, panos } from "@/db/schema"
import { actualizarPanoPlantasSchema } from "@/schemas/invplantas.schema"
import { type Pano, panoSchema } from "@/schemas/panos.schema"
import { requirePermiso } from "@/server/auth/auth.queries"
import type { ActionResult } from "@/types/action.types"

// numeric (precision/scale) se persiste como string en pg; los enteros (plantas) no.
const aColumnas = (data: Pano) => ({
  nombre: data.nombre,
  variedad: data.variedad || null,
  anio: data.anio || null,
  hectareas: data.hectareas === null ? null : String(data.hectareas),
  hasRiego: data.hasRiego === null ? null : String(data.hasRiego),
  densidad: data.densidad === null ? null : String(data.densidad),
  plantas: data.plantas,
  color: data.color || null,
})

// id epoch-ms (convención del origen). +1 ante colisión en el mismo milisegundo.
const generarId = async (): Promise<number> => {
  let id = Date.now()
  while (await db.query.panos.findFirst({ where: eq(panos.id, id) })) id += 1
  return id
}

export const crearPano = async (input: unknown): Promise<ActionResult> => {
  await requirePermiso("cuaderno.panos")
  const parsed = panoSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const id = await generarId()
  await db.insert(panos).values({ id, ...aColumnas(parsed.data) })
  revalidatePath("/cuaderno/panos")
  return { ok: true }
}

export const editarPano = async (
  id: number,
  input: unknown,
): Promise<ActionResult> => {
  await requirePermiso("cuaderno.panos")
  const parsed = panoSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  await db.update(panos).set(aColumnas(parsed.data)).where(eq(panos.id, id))
  revalidatePath("/cuaderno/panos")
  return { ok: true }
}

export const eliminarPano = async (id: number): Promise<ActionResult> => {
  await requirePermiso("cuaderno.panos")
  const conAplicacion = await db.query.fieldRecords.findFirst({
    where: eq(fieldRecords.panoId, id),
  })
  if (conAplicacion)
    return {
      ok: false,
      error: "No se puede eliminar: el paño tiene aplicaciones asociadas",
    }
  const conOrden = await db.query.applicationOrders.findFirst({
    where: arrayContains(applicationOrders.panoIds, [String(id)]),
  })
  if (conOrden)
    return {
      ok: false,
      error: "No se puede eliminar: el paño está en órdenes de aplicación",
    }
  await db.delete(panos).where(eq(panos.id, id))
  revalidatePath("/cuaderno/panos")
  return { ok: true }
}

// Write-back desde el Inventario de huerto: actualiza el nº de plantas del paño
// con el total contado en terreno (index.html: "Actualizar paño a N plantas").
export const actualizarPanoPlantas = async (
  input: unknown,
): Promise<ActionResult> => {
  await requirePermiso("cuaderno.panos")
  const parsed = actualizarPanoPlantasSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }
  await db
    .update(panos)
    .set({ plantas: parsed.data.plantas })
    .where(eq(panos.id, parsed.data.panoId))
  revalidatePath("/cuaderno/panos")
  revalidatePath("/terreno/invplantas")
  return { ok: true }
}
