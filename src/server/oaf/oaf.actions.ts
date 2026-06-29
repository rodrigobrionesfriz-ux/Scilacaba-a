"use server"

import { randomUUID } from "node:crypto"
import { eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { OAF_PADDING, PREFIJO_OAF } from "@/constants/fertirriego.constants"
import { db } from "@/db/client"
import { counters, fertirriegoOrdenes } from "@/db/schema"
import { type Oaf, oafSchema } from "@/schemas/oaf.schema"
import { requirePermiso } from "@/server/auth/auth.queries"
import type { ActionResult } from "@/types/action.types"

const revalidar = () => revalidatePath("/cuaderno/fertirriego/ordenes")

const hoy = (): string => new Date().toISOString().slice(0, 10)

// Correlativo OAF-00001 (upsert+incremento atómico del counter, padding a 5).
const siguienteNumero = async (): Promise<string> => {
  const [counter] = await db
    .insert(counters)
    .values({ clave: PREFIJO_OAF, valor: 1 })
    .onConflictDoUpdate({
      target: counters.clave,
      set: { valor: sql`${counters.valor} + 1` },
    })
    .returning({ valor: counters.valor })
  return `${PREFIJO_OAF}-${String(counter.valor).padStart(OAF_PADDING, "0")}`
}

// Las líneas son el blob del origen (verbatim): {prod, dosis, unidad, obs}.
const aColumnas = (data: Oaf) => ({
  fecha: data.fecha,
  forma: data.forma || null,
  horario: data.horario || null,
  estado: data.estado || null,
  responsable: data.responsable || null,
  sectores: data.sectores,
  lineas: data.lineas,
})

export const crearOaf = async (input: unknown): Promise<ActionResult> => {
  await requirePermiso("cuaderno.editar")
  const parsed = oafSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const numero = await siguienteNumero()
  await db.insert(fertirriegoOrdenes).values({
    id: randomUUID(),
    numero,
    ...aColumnas(parsed.data),
    confirmada: false,
    creadoAt: new Date(),
    updatedAt: new Date(),
  })
  revalidar()
  return { ok: true }
}

export const editarOaf = async (
  id: string,
  input: unknown,
): Promise<ActionResult> => {
  await requirePermiso("cuaderno.editar")
  const parsed = oafSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  await db
    .update(fertirriegoOrdenes)
    .set({ ...aColumnas(parsed.data), updatedAt: new Date() })
    .where(eq(fertirriegoOrdenes.id, id))
  revalidar()
  return { ok: true }
}

export const eliminarOaf = async (id: string): Promise<ActionResult> => {
  await requirePermiso("cuaderno.editar")
  await db.delete(fertirriegoOrdenes).where(eq(fertirriegoOrdenes.id, id))
  revalidar()
  return { ok: true }
}

// Confirmar/desconfirmar es un toggle reversible sobre la propia orden (fiel al
// monolito: no genera una entidad aparte ni recalcula cantidades).
export const confirmarOaf = async (id: string): Promise<ActionResult> => {
  await requirePermiso("cuaderno.confirmar")
  await db
    .update(fertirriegoOrdenes)
    .set({ confirmada: true, confirmadaFecha: hoy(), updatedAt: new Date() })
    .where(eq(fertirriegoOrdenes.id, id))
  revalidar()
  return { ok: true }
}

export const desconfirmarOaf = async (id: string): Promise<ActionResult> => {
  await requirePermiso("cuaderno.confirmar")
  await db
    .update(fertirriegoOrdenes)
    .set({ confirmada: false, confirmadaFecha: null, updatedAt: new Date() })
    .where(eq(fertirriegoOrdenes.id, id))
  revalidar()
  return { ok: true }
}
