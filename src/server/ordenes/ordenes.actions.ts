"use server"

import { eq, inArray, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { OA_PADDING, PREFIJO_OA } from "@/constants/cuaderno.constants"
import { db } from "@/db/client"
import { applicationConfirmations, applicationOrders, counters, panos } from "@/db/schema"
import { ordenSchema } from "@/schemas/ordenes.schema"
import { requirePermiso } from "@/server/auth/auth.queries"
import type { ActionResult } from "@/types/action.types"
import type { Orden } from "@/schemas/ordenes.schema"
import {
  calcularDistribucion,
  type PanoDistribInput,
  resolverHas,
} from "@/utils/ordenes.utils"

const revalidar = () => {
  revalidatePath("/cuaderno/ordenes")
  revalidatePath("/cuaderno/confirmaciones")
}

const n2s = (n: number): string => String(n)

// Id epoch-ms con +1 ante colisión (convención del origen).
const generarId = async (): Promise<number> => {
  let id = Date.now()
  while (await db.query.applicationOrders.findFirst({ where: eq(applicationOrders.id, id) }))
    id += 1
  return id
}

// Correlativo OA-00001 (upsert+incremento atómico del counter, padding a 5).
const siguienteNumero = async (): Promise<string> => {
  const [counter] = await db
    .insert(counters)
    .values({ clave: PREFIJO_OA, valor: 1 })
    .onConflictDoUpdate({
      target: counters.clave,
      set: { valor: sql`${counters.valor} + 1` },
    })
    .returning({ valor: counters.valor })
  return `${PREFIJO_OA}-${String(counter.valor).padStart(OA_PADDING, "0")}`
}

// Resuelve los paños seleccionados a la entrada de distribución (has según tipo).
const panosParaDistribucion = async (
  panoIds: string[],
  tipoApp: string,
): Promise<PanoDistribInput[]> => {
  const ids = panoIds.map((id) => Number(id)).filter((n) => Number.isFinite(n))
  if (ids.length === 0) return []
  const rows = await db.query.panos.findMany({ where: inArray(panos.id, ids) })
  const porId = new Map(rows.map((r) => [String(r.id), r]))
  return panoIds.flatMap((id) => {
    const p = porId.get(id)
    if (!p) return []
    return [
      {
        id,
        nombre: p.nombre,
        variedad: p.variedad ?? "",
        anio: p.anio ?? "",
        color: p.color ?? "",
        has: resolverHas(
          {
            hectareas: p.hectareas === null ? null : Number(p.hectareas),
            hasRiego: p.hasRiego === null ? null : Number(p.hasRiego),
          },
          tipoApp,
        ),
      },
    ]
  })
}

// Columnas comunes (distribución calculada server-side: única fuente de verdad).
const aColumnas = async (data: Orden) => {
  const panosDist = await panosParaDistribucion(data.panoIds, data.tipoApp)
  const calc = calcularDistribucion(data.productos, panosDist, data.moj, data.vha)
  const principal = calc.productos[0]
  return {
    fecha: data.fecha,
    tipoApp: data.tipoApp,
    fenologico: data.fenologico,
    objetivos: data.objetivos,
    objetivoOtro: data.objetivoOtro || null,
    especie: data.especie || null,
    responsable: data.responsable || null,
    metodo: data.metodo || null,
    panoIds: data.panoIds,
    productos: calc.productos,
    distribucion: calc.distribucion,
    producto: principal?.nombre ?? null,
    dosis: principal ? n2s(principal.dosis) : null,
    unidad: principal?.unidad ?? null,
    unitS: principal?.unitS ?? null,
    moj: n2s(data.moj),
    vha: n2s(data.vha),
    mojT: n2s(calc.mojT),
    notas: data.notas || null,
    tHas: n2s(calc.tHas),
    tAgua: n2s(calc.tAgua),
    tProd: n2s(calc.tProd),
    margin: n2s(calc.tProd),
  }
}

export const crearOrden = async (input: unknown): Promise<ActionResult> => {
  await requirePermiso("cuaderno.editar")
  const parsed = ordenSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const [id, numero, columnas] = await Promise.all([
    generarId(),
    siguienteNumero(),
    aColumnas(parsed.data),
  ])
  await db.insert(applicationOrders).values({ id, numero, ...columnas })
  revalidar()
  return { ok: true }
}

export const editarOrden = async (
  id: number,
  input: unknown,
): Promise<ActionResult> => {
  const usuario = await requirePermiso("cuaderno.editar")
  const parsed = ordenSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const columnas = await aColumnas(parsed.data)
  await db
    .update(applicationOrders)
    .set({
      ...columnas,
      editada: true,
      editadaFecha: new Date().toISOString(),
      editadaPor: usuario.id,
    })
    .where(eq(applicationOrders.id, id))
  revalidar()
  return { ok: true }
}

export const eliminarOrden = async (id: number): Promise<ActionResult> => {
  await requirePermiso("cuaderno.editar")
  const conConfirmacion = await db.query.applicationConfirmations.findFirst({
    where: eq(applicationConfirmations.ordenId, id),
  })
  if (conConfirmacion)
    return {
      ok: false,
      error: "No se puede eliminar: la orden tiene confirmaciones",
    }
  await db.delete(applicationOrders).where(eq(applicationOrders.id, id))
  revalidar()
  return { ok: true }
}
