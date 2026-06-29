"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db/client"
import { invplantas } from "@/db/schema"
import {
  editarEstadoSchema,
  eliminarPlantaSchema,
  type InvplantaInput,
  insertarPlantaSchema,
  sincronizarInvplantasSchema,
} from "@/schemas/invplantas.schema"
import { requirePermiso } from "@/server/auth/auth.queries"
import type { PlantaCapturada } from "@/types/invplantas.types"
import {
  generarPlantas,
  narrowGps,
  narrowPlantas,
  recalcularContadores,
  renumerarRecodificar,
} from "@/utils/invplantas.utils"
import type { ActionResult } from "@/types/action.types"

const RUTA = "/terreno/invplantas"

type SyncResult = { ok: true; ids: string[] } | { ok: false; error: string }

// Mapea una hilera (capturada offline) a columnas. plantas[] y los contadores se
// generan en el servidor desde la secuencia (zigzag + GPS interpolado) — fuente
// de verdad: utils, no se confía en el cliente.
const aColumnas = (s: InvplantaInput, fechaSync: Date) => {
  const plantas = generarPlantas({
    secuencia: s.secuencia,
    hilera: s.hilera,
    codigoBase: s.codigoBase,
    gpsInicio: s.gpsInicio,
    gpsFin: s.gpsFin,
  })
  const { countPrincipal, countPoliniz } = recalcularContadores(s.secuencia)
  return {
    cuartelId: s.cuartelId,
    cuartel: s.cuartel || null,
    variedad: s.variedad || null,
    portainjerto: s.portainjerto || null,
    polinizante: s.polinizante || null,
    hilera: s.hilera || null,
    codigoBase: s.codigoBase || null,
    usuario: s.usuario || null,
    countPrincipal,
    countPoliniz,
    secuencia: s.secuencia,
    gpsInicio: s.gpsInicio,
    gpsFin: s.gpsFin,
    plantas,
    sincronizado: true,
    fechaInicio: new Date(s.fechaInicio),
    fechaSync,
    updatedAt: fechaSync,
  }
}

// Sube un lote de hileras a Postgres (upsert por id → idempotente, la re-subida
// no duplica). Gateado por invplantas.ver (permiso de captura en terreno).
export const sincronizarInvplantas = async (
  input: unknown,
): Promise<SyncResult> => {
  await requirePermiso("invplantas.ver")
  const parsed = sincronizarInvplantasSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }

  const fechaSync = new Date()
  for (const s of parsed.data) {
    const cols = aColumnas(s, fechaSync)
    await db
      .insert(invplantas)
      .values({ id: s.id, ...cols })
      .onConflictDoUpdate({ target: invplantas.id, set: cols })
  }

  revalidatePath(RUTA)
  return { ok: true, ids: parsed.data.map((s) => s.id) }
}

const contadores = (plantas: readonly PlantaCapturada[]) => ({
  countPrincipal: plantas.filter((p) => p.tipo === "principal").length,
  countPoliniz: plantas.filter((p) => p.tipo === "poliniz").length,
})

// Persiste un nuevo array de plantas en una hilera + contadores + updatedAt.
const guardarPlantas = async (id: string, plantas: PlantaCapturada[]) => {
  await db
    .update(invplantas)
    .set({ plantas, ...contadores(plantas), updatedAt: new Date() })
    .where(eq(invplantas.id, id))
  revalidatePath(RUTA)
}

// Cambia el estado de una planta en el mapa 2D (admin, invplantas.editar).
export const editarEstadoPlanta = async (
  input: unknown,
): Promise<ActionResult> => {
  await requirePermiso("invplantas.editar")
  const parsed = editarEstadoSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }
  const { id, seq, estado } = parsed.data
  const row = await db.query.invplantas.findFirst({
    where: eq(invplantas.id, id),
  })
  if (!row) return { ok: false, error: "Hilera no encontrada" }
  const plantas = narrowPlantas(row.plantas).map((p) =>
    p.seq === seq ? { ...p, estado } : p,
  )
  await guardarPlantas(id, plantas)
  return { ok: true }
}

// Inserta una planta (faltó contar) antes/después de una posición, renumera,
// recodifica y reinterpola el GPS de la hilera completa (admin).
export const insertarPlanta = async (input: unknown): Promise<ActionResult> => {
  await requirePermiso("invplantas.editar")
  const parsed = insertarPlantaSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }
  const { id, seq, posicion, tipo, estado } = parsed.data
  const row = await db.query.invplantas.findFirst({
    where: eq(invplantas.id, id),
  })
  if (!row) return { ok: false, error: "Hilera no encontrada" }
  const actuales = narrowPlantas(row.plantas)
  const idx = actuales.findIndex((p) => p.seq === seq)
  if (idx === -1) return { ok: false, error: "Planta no encontrada" }
  const nueva: PlantaCapturada = {
    seq: 0,
    codigo: "",
    tipo,
    estado,
    lat: null,
    lng: null,
  }
  const pos = posicion === "antes" ? idx : idx + 1
  const conNueva = [...actuales.slice(0, pos), nueva, ...actuales.slice(pos)]
  const renum = renumerarRecodificar(
    conNueva,
    row.codigoBase ?? "",
    narrowGps(row.gpsInicio),
    narrowGps(row.gpsFin),
  )
  await guardarPlantas(id, renum)
  return { ok: true }
}

// Elimina una planta (error de conteo), renumera/recodifica/reinterpola (admin).
export const eliminarPlanta = async (input: unknown): Promise<ActionResult> => {
  await requirePermiso("invplantas.editar")
  const parsed = eliminarPlantaSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }
  const { id, seq } = parsed.data
  const row = await db.query.invplantas.findFirst({
    where: eq(invplantas.id, id),
  })
  if (!row) return { ok: false, error: "Hilera no encontrada" }
  const restantes = narrowPlantas(row.plantas).filter((p) => p.seq !== seq)
  const renum = renumerarRecodificar(
    restantes,
    row.codigoBase ?? "",
    narrowGps(row.gpsInicio),
    narrowGps(row.gpsFin),
  )
  await guardarPlantas(id, renum)
  return { ok: true }
}
