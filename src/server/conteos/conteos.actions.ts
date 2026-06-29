"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db/client"
import { conteos } from "@/db/schema"
import {
  type ConteoInput,
  sincronizarConteosSchema,
} from "@/schemas/conteos.schema"
import { requirePermiso } from "@/server/auth/auth.queries"
import { promedioCentros } from "@/utils/conteos.utils"

// Resultado de la subida: devuelve los ids efectivamente sincronizados para que el
// cliente (Dexie) los marque como subidos.
type SyncResult =
  | { ok: true; ids: string[] }
  | { ok: false; error: string }

// Mapea un conteo (capturado offline) a columnas. promedioCentros/nArboles se
// recalculan en el servidor (fuente de verdad: utils) — no se confía en el cliente.
const aColumnas = (c: ConteoInput, fechaSync: Date) => ({
  panoId: c.panoId,
  panoNombre: c.panoNombre || null,
  variedad: c.variedad || null,
  especie: c.especie || null,
  etapa: c.etapa || null,
  fijosCodigos: c.fijosCodigos,
  usuario: c.usuario || null,
  arboles: c.arboles,
  promedioCentros: String(promedioCentros(c.arboles)),
  nArboles: c.arboles.length,
  sincronizado: true,
  fechaInicio: new Date(c.fechaInicio),
  fechaFin: c.fechaFin ? new Date(c.fechaFin) : null,
  fechaSync,
  updatedAt: fechaSync,
})

// Sube un lote de conteos a Postgres (upsert por id → idempotente, la re-subida no
// duplica). Gateado por conteos.ver (permiso de captura en terreno).
export const sincronizarConteos = async (
  input: unknown,
): Promise<SyncResult> => {
  await requirePermiso("conteos.ver")
  const parsed = sincronizarConteosSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }

  const fechaSync = new Date()
  for (const c of parsed.data) {
    const cols = aColumnas(c, fechaSync)
    await db
      .insert(conteos)
      .values({ id: c.id, ...cols })
      .onConflictDoUpdate({ target: conteos.id, set: cols })
  }

  revalidatePath("/terreno/conteos")
  return { ok: true, ids: parsed.data.map((c) => c.id) }
}
