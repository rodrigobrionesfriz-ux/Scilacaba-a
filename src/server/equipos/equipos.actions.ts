"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db/client"
import { equipos } from "@/db/schema"
import { type Equipo, equipoSchema } from "@/schemas/equipos.schema"
import { registrarAuditoria } from "@/server/audit/audit.core"
import { requirePermiso } from "@/server/auth/auth.queries"
import type { ActionResult } from "@/types/action.types"

const revalidar = () => revalidatePath("/cuaderno/ordenes")

const aColumnas = (data: Equipo) => ({
  nombre: data.nombre,
  capacidad: String(data.capacidad),
  activo: data.activo,
})

const generarId = async (): Promise<number> => {
  let id = Date.now()
  while (await db.query.equipos.findFirst({ where: eq(equipos.id, id) })) id += 1
  return id
}

export const crearEquipo = async (input: unknown): Promise<ActionResult> => {
  const usuario = await requirePermiso("cuaderno.editar")
  const parsed = equipoSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const data = parsed.data
  const existe = await db.query.equipos.findFirst({ where: eq(equipos.nombre, data.nombre) })
  if (existe) return { ok: false, error: "Ya existe una nebulizadora con ese nombre" }
  const id = await generarId()
  await db.insert(equipos).values({ id, ...aColumnas(data) })
  await registrarAuditoria({
    usuario: usuario.id,
    accion: "equipo.crear",
    detalle: data.nombre,
    referencia: String(id),
  })
  revalidar()
  return { ok: true }
}

export const editarEquipo = async (id: number, input: unknown): Promise<ActionResult> => {
  const usuario = await requirePermiso("cuaderno.editar")
  const parsed = equipoSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  await db.update(equipos).set(aColumnas(parsed.data)).where(eq(equipos.id, id))
  await registrarAuditoria({
    usuario: usuario.id,
    accion: "equipo.editar",
    detalle: parsed.data.nombre,
    referencia: String(id),
  })
  revalidar()
  return { ok: true }
}

export const eliminarEquipo = async (id: number): Promise<ActionResult> => {
  const usuario = await requirePermiso("cuaderno.editar")
  await db.update(equipos).set({ activo: false }).where(eq(equipos.id, id))
  await registrarAuditoria({
    usuario: usuario.id,
    accion: "equipo.eliminar",
    detalle: String(id),
    referencia: String(id),
  })
  revalidar()
  return { ok: true }
}
