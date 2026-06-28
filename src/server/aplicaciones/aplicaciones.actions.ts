"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db/client"
import { fieldRecords } from "@/db/schema"
import { type Aplicacion, aplicacionSchema } from "@/schemas/aplicaciones.schema"
import { requirePermiso } from "@/server/auth/auth.queries"
import type { ActionResult } from "@/types/action.types"

const aColumnas = (data: Aplicacion) => ({
  fecha: data.fecha,
  panoId: data.panoId,
  tipo: data.tipo,
  producto: data.producto,
  dosis: data.dosis || null,
  unidad: data.unidad,
  metodo: data.metodo,
  operador: data.operador || null,
  obs: data.obs || null,
  lote: data.lote || null,
})

// id epoch-ms (convención del origen). +1 ante colisión en el mismo milisegundo.
const generarId = async (): Promise<number> => {
  let id = Date.now()
  while (await db.query.fieldRecords.findFirst({ where: eq(fieldRecords.id, id) }))
    id += 1
  return id
}

export const crearAplicacion = async (input: unknown): Promise<ActionResult> => {
  await requirePermiso("cuaderno.editar")
  const parsed = aplicacionSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const id = await generarId()
  await db.insert(fieldRecords).values({ id, ...aColumnas(parsed.data) })
  revalidatePath("/cuaderno/aplicaciones")
  return { ok: true }
}

export const editarAplicacion = async (
  id: number,
  input: unknown,
): Promise<ActionResult> => {
  await requirePermiso("cuaderno.editar")
  const parsed = aplicacionSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  await db
    .update(fieldRecords)
    .set(aColumnas(parsed.data))
    .where(eq(fieldRecords.id, id))
  revalidatePath("/cuaderno/aplicaciones")
  return { ok: true }
}

export const eliminarAplicacion = async (id: number): Promise<ActionResult> => {
  await requirePermiso("cuaderno.editar")
  await db.delete(fieldRecords).where(eq(fieldRecords.id, id))
  revalidatePath("/cuaderno/aplicaciones")
  return { ok: true }
}
