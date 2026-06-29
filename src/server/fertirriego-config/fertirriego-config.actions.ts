"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db/client"
import { fertirriegoConfig } from "@/db/schema"
import { configFertSchema } from "@/schemas/fertirriego-config.schema"
import { requirePermiso } from "@/server/auth/auth.queries"
import type { ActionResult } from "@/types/action.types"

// Guarda la configuración singleton (upsert del blob cfg en la fila id = "main").
export const guardarConfigFert = async (
  input: unknown,
): Promise<ActionResult> => {
  await requirePermiso("cuaderno.editar")
  const parsed = configFertSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  await db
    .insert(fertirriegoConfig)
    .values({ id: "main", cfg: parsed.data })
    .onConflictDoUpdate({
      target: fertirriegoConfig.id,
      set: { cfg: parsed.data },
    })
  revalidatePath("/cuaderno/fertirriego/parametros")
  revalidatePath("/cuaderno/fertirriego/ordenes")
  return { ok: true }
}
