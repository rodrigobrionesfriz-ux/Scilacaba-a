"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db/client"
import { customers } from "@/db/schema"
import { type Cliente, clienteSchema } from "@/schemas/clientes.schema"
import { requirePermiso } from "@/server/auth/auth.queries"
import type { ActionResult } from "@/types/action.types"
import { rutValido } from "@/utils/rut.utils"

const aColumnas = (data: Cliente) => ({
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

export const crearCliente = async (input: unknown): Promise<ActionResult> => {
  await requirePermiso("clientes.crear")
  const parsed = clienteSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const data = parsed.data
  if (data.rut && !rutValido(data.rut))
    return { ok: false, error: "El RUT (con DV) es inválido" }
  const existe = await db.query.customers.findFirst({
    where: eq(customers.codigo, data.codigo),
  })
  if (existe) return { ok: false, error: "Ya existe un cliente con ese código" }
  await db.insert(customers).values({ codigo: data.codigo, ...aColumnas(data) })
  revalidatePath("/clientes")
  return { ok: true }
}

export const editarCliente = async (
  codigo: string,
  input: unknown,
): Promise<ActionResult> => {
  await requirePermiso("clientes.crear")
  const parsed = clienteSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const data = parsed.data
  if (data.rut && !rutValido(data.rut))
    return { ok: false, error: "El RUT (con DV) es inválido" }
  await db
    .update(customers)
    .set({ ...aColumnas(data), modificadoAt: new Date() })
    .where(eq(customers.codigo, codigo))
  revalidatePath("/clientes")
  return { ok: true }
}
