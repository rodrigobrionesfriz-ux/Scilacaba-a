"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db/client"
import { fieldProducts } from "@/db/schema"
import { aportesSchema } from "@/schemas/aportes.schema"
import {
  type ProductoCuaderno,
  productoCuadernoSchema,
} from "@/schemas/productos-cuaderno.schema"
import { requirePermiso } from "@/server/auth/auth.queries"
import type { ActionResult } from "@/types/action.types"

const aColumnas = (data: ProductoCuaderno) => ({
  tipo: data.tipo || null,
  unidad: data.unidad || null,
  dosis: data.dosis || null,
  ingredienteActivo: data.ingredienteActivo || null,
  objetivo: data.objetivo || null,
})

export const crearProductoCuaderno = async (
  input: unknown,
): Promise<ActionResult> => {
  await requirePermiso("cuaderno.editar")
  const parsed = productoCuadernoSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const data = parsed.data
  const existe = await db.query.fieldProducts.findFirst({
    where: eq(fieldProducts.nombre, data.nombre),
  })
  if (existe) return { ok: false, error: "Ya existe un producto con ese nombre" }
  await db.insert(fieldProducts).values({ nombre: data.nombre, ...aColumnas(data) })
  revalidatePath("/cuaderno/productos")
  return { ok: true }
}

export const editarProductoCuaderno = async (
  nombre: string,
  input: unknown,
): Promise<ActionResult> => {
  await requirePermiso("cuaderno.editar")
  const parsed = productoCuadernoSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  await db
    .update(fieldProducts)
    .set(aColumnas(parsed.data))
    .where(eq(fieldProducts.nombre, nombre))
  revalidatePath("/cuaderno/productos")
  return { ok: true }
}

export const eliminarProductoCuaderno = async (
  nombre: string,
): Promise<ActionResult> => {
  await requirePermiso("cuaderno.editar")
  await db.delete(fieldProducts).where(eq(fieldProducts.nombre, nombre))
  revalidatePath("/cuaderno/productos")
  return { ok: true }
}

// Composición nutricional (fertirriego): actualiza el blob `aportes` + unidad/dosis
// por defecto del producto. Revalida la pestaña Productos y aportes de fertirriego.
export const guardarAportes = async (input: unknown): Promise<ActionResult> => {
  await requirePermiso("cuaderno.editar")
  const parsed = aportesSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const { nombre, unidad, dosis, aportes } = parsed.data
  await db
    .update(fieldProducts)
    .set({ unidad: unidad || null, dosis: dosis || null, aportes })
    .where(eq(fieldProducts.nombre, nombre))
  revalidatePath("/cuaderno/fertirriego/productos")
  return { ok: true }
}
