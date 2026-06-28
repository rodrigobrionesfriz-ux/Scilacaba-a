"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db/client"
import { applicationConfirmations, applicationOrders } from "@/db/schema"
import { confirmacionSchema } from "@/schemas/confirmaciones.schema"
import { requirePermiso } from "@/server/auth/auth.queries"
import type { ActionResult } from "@/types/action.types"
import {
  aProductosOrden,
  recalcularProductosReales,
} from "@/utils/ordenes.utils"

const revalidar = () => {
  revalidatePath("/cuaderno/ordenes")
  revalidatePath("/cuaderno/confirmaciones")
}

const n2s = (n: number | null): string | null => (n === null ? null : String(n))

const generarId = async (): Promise<number> => {
  let id = Date.now()
  while (
    await db.query.applicationConfirmations.findFirst({
      where: eq(applicationConfirmations.id, id),
    })
  )
    id += 1
  return id
}

// Confirma una OA: recalcula las cantidades reales aplicadas escalando los
// productos planificados por la proporción de agua real vs planificada.
export const crearConfirmacion = async (
  input: unknown,
): Promise<ActionResult> => {
  const usuario = await requirePermiso("cuaderno.confirmar")
  const parsed = confirmacionSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const data = parsed.data

  const orden = await db.query.applicationOrders.findFirst({
    where: eq(applicationOrders.id, data.ordenId),
  })
  if (!orden) return { ok: false, error: "La orden no existe" }

  const aguaPlan = orden.tAgua === null ? 0 : Number(orden.tAgua)
  const productosReales = recalcularProductosReales(
    aProductosOrden(orden.productos),
    aguaPlan,
    data.aguaReal ?? 0,
  )

  const id = await generarId()
  await db.insert(applicationConfirmations).values({
    id,
    ordenId: orden.id,
    ordenNumero: orden.numero,
    fechaApp: data.fechaApp,
    horaInicio: data.horaInicio || null,
    horaFin: data.horaFin || null,
    operador: data.operador,
    equipo: data.equipo || null,
    turno: data.turno || null,
    tempAmb: n2s(data.tempAmb),
    humedad: n2s(data.humedad),
    viento: n2s(data.viento),
    condClima: data.condClima || null,
    panoIds: data.panoIds,
    productosReales,
    aguaReal: n2s(data.aguaReal),
    notas: data.notas || null,
    creadaAt: new Date(),
    creadaPor: usuario.id,
  })
  revalidar()
  return { ok: true }
}

export const eliminarConfirmacion = async (
  id: number,
): Promise<ActionResult> => {
  await requirePermiso("cuaderno.confirmar")
  await db.delete(applicationConfirmations).where(eq(applicationConfirmations.id, id))
  revalidar()
  return { ok: true }
}
