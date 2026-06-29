"use server"

import { randomUUID } from "node:crypto"
import { arrayContains, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db/client"
import { fertirriegoOrdenes, fertirriegoSectores } from "@/db/schema"
import { type Sector, sectorSchema } from "@/schemas/sectores.schema"
import { requirePermiso } from "@/server/auth/auth.queries"
import type { ActionResult } from "@/types/action.types"

const revalidar = () => revalidatePath("/cuaderno/fertirriego/sectores")

// numeric (ha) se persiste como string en pg; plantas (entero) no.
const aColumnas = (data: Sector) => ({
  nombre: data.nombre,
  equipo: data.equipo || null,
  ha: data.ha === null ? null : String(data.ha),
  variedad: data.variedad || null,
  plantas: data.plantas,
})

export const crearSector = async (input: unknown): Promise<ActionResult> => {
  await requirePermiso("cuaderno.editar")
  const parsed = sectorSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  await db
    .insert(fertirriegoSectores)
    .values({ id: randomUUID(), ...aColumnas(parsed.data) })
  revalidar()
  return { ok: true }
}

export const editarSector = async (
  id: string,
  input: unknown,
): Promise<ActionResult> => {
  await requirePermiso("cuaderno.editar")
  const parsed = sectorSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  await db
    .update(fertirriegoSectores)
    .set(aColumnas(parsed.data))
    .where(eq(fertirriegoSectores.id, id))
  revalidar()
  return { ok: true }
}

export const eliminarSector = async (id: string): Promise<ActionResult> => {
  await requirePermiso("cuaderno.editar")
  const enOrden = await db.query.fertirriegoOrdenes.findFirst({
    where: arrayContains(fertirriegoOrdenes.sectores, [id]),
  })
  if (enOrden)
    return {
      ok: false,
      error: "No se puede eliminar: el sector está en una orden de fertirriego",
    }
  await db.delete(fertirriegoSectores).where(eq(fertirriegoSectores.id, id))
  revalidar()
  return { ok: true }
}
