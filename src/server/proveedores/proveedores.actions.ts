"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db/client"
import { providers } from "@/db/schema"
import { type Proveedor, proveedorSchema } from "@/schemas/proveedores.schema"
import { requirePermiso } from "@/server/auth/auth.queries"
import type { ActionResult } from "@/types/action.types"
import { rutValido } from "@/utils/rut.utils"

const aColumnas = (data: Proveedor) => ({
  razonSocial: data.razonSocial,
  rut: data.rut || null,
  giro: data.giro || null,
  direccion: data.direccion || null,
  comuna: data.comuna || null,
  ciudad: data.ciudad || null,
  telefono: data.telefono || null,
  email: data.email || null,
  contacto: data.contacto || null,
  activo: data.activo,
})

export const crearProveedor = async (input: unknown): Promise<ActionResult> => {
  await requirePermiso("proveedores.crear")
  const parsed = proveedorSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const data = parsed.data
  if (data.rut && !rutValido(data.rut))
    return { ok: false, error: "El RUT (con DV) es inválido" }
  const existe = await db.query.providers.findFirst({
    where: eq(providers.codigo, data.codigo),
  })
  if (existe) return { ok: false, error: "Ya existe un proveedor con ese código" }
  await db.insert(providers).values({ codigo: data.codigo, ...aColumnas(data) })
  revalidatePath("/proveedores")
  return { ok: true }
}

export const editarProveedor = async (
  codigo: string,
  input: unknown,
): Promise<ActionResult> => {
  await requirePermiso("proveedores.crear")
  const parsed = proveedorSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const data = parsed.data
  if (data.rut && !rutValido(data.rut))
    return { ok: false, error: "El RUT (con DV) es inválido" }
  await db
    .update(providers)
    .set({ ...aColumnas(data), modificadoAt: new Date() })
    .where(eq(providers.codigo, codigo))
  revalidatePath("/proveedores")
  return { ok: true }
}
