"use server"

import { count, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import {
  EMPRESA_KEY,
  INDICADORES_KEY,
} from "@/constants/config.constants"
import { db } from "@/db/client"
import { config, groups, productTypes, products } from "@/db/schema"
import {
  empresaSchema,
  grupoSchema,
  guardarIndicadoresSchema,
  tipoSchema,
} from "@/schemas/config.schema"
import { registrarAuditoria } from "@/server/audit/audit.core"
import { requirePermiso } from "@/server/auth/auth.queries"
import { getIndicadores } from "@/server/config/config.queries"
import type { ActionResult } from "@/types/action.types"
import { construirMeses, fusionarTemporada } from "@/utils/indicadores.utils"
import { rutValido } from "@/utils/rut.utils"

const errorZod = (msg?: string): ActionResult => ({
  ok: false,
  error: msg ?? "Datos inválidos",
})

// --- Empresa ---
export const guardarEmpresa = async (input: unknown): Promise<ActionResult> => {
  const usuario = await requirePermiso("config.editar")
  const parsed = empresaSchema.safeParse(input)
  if (!parsed.success) return errorZod(parsed.error.issues[0]?.message)
  const data = parsed.data
  if (data.rut && !rutValido(data.rut))
    return { ok: false, error: "El RUT (con DV) es inválido" }
  await db
    .insert(config)
    .values({ clave: EMPRESA_KEY, valor: data })
    .onConflictDoUpdate({ target: config.clave, set: { valor: data } })
  await registrarAuditoria({
    usuario: usuario.id,
    accion: "config.empresa.update",
    detalle: "Datos de empresa actualizados",
    referencia: data.rut,
  })
  revalidatePath("/config")
  return { ok: true }
}

// --- Tipos de producto ---
export const crearTipo = async (input: unknown): Promise<ActionResult> => {
  const usuario = await requirePermiso("config.editar")
  const parsed = tipoSchema.safeParse(input)
  if (!parsed.success) return errorZod(parsed.error.issues[0]?.message)
  const data = parsed.data
  const existe = await db.query.productTypes.findFirst({
    where: eq(productTypes.nombre, data.nombre),
  })
  if (existe) return { ok: false, error: "Ya existe un tipo con ese nombre" }
  await db.insert(productTypes).values({
    nombre: data.nombre,
    descripcion: data.descripcion || null,
    activo: data.activo,
  })
  await registrarAuditoria({
    usuario: usuario.id,
    accion: "tipo.crear",
    detalle: "Creación de tipo de producto",
    referencia: data.nombre,
  })
  revalidatePath("/config")
  return { ok: true }
}

export const editarTipo = async (
  nombre: string,
  input: unknown,
): Promise<ActionResult> => {
  const usuario = await requirePermiso("config.editar")
  const parsed = tipoSchema.safeParse({ ...(input ?? {}), nombre })
  if (!parsed.success) return errorZod(parsed.error.issues[0]?.message)
  const data = parsed.data
  await db
    .update(productTypes)
    .set({
      descripcion: data.descripcion || null,
      activo: data.activo,
      modificadoAt: new Date(),
    })
    .where(eq(productTypes.nombre, nombre))
  await registrarAuditoria({
    usuario: usuario.id,
    accion: "tipo.editar",
    detalle: "Edición de tipo de producto",
    referencia: nombre,
  })
  revalidatePath("/config")
  return { ok: true }
}

export const eliminarTipo = async (nombre: string): Promise<ActionResult> => {
  const usuario = await requirePermiso("config.editar")
  const [{ n }] = await db
    .select({ n: count() })
    .from(products)
    .where(eq(products.tipoProducto, nombre))
  if (n > 0)
    return {
      ok: false,
      error: `${n} producto(s) usan este tipo. Reasígnalos primero.`,
    }
  await db.delete(productTypes).where(eq(productTypes.nombre, nombre))
  await registrarAuditoria({
    usuario: usuario.id,
    accion: "tipo.eliminar",
    detalle: "Eliminación de tipo de producto",
    referencia: nombre,
  })
  revalidatePath("/config")
  return { ok: true }
}

// --- Grupos / subgrupos ---
export const crearGrupo = async (input: unknown): Promise<ActionResult> => {
  const usuario = await requirePermiso("config.editar")
  const parsed = grupoSchema.safeParse(input)
  if (!parsed.success) return errorZod(parsed.error.issues[0]?.message)
  const data = parsed.data
  const existe = await db.query.groups.findFirst({
    where: eq(groups.nombre, data.nombre),
  })
  if (existe) return { ok: false, error: "Ya existe un grupo con ese nombre" }
  await db
    .insert(groups)
    .values({ nombre: data.nombre, subgrupos: data.subgrupos })
  await registrarAuditoria({
    usuario: usuario.id,
    accion: "grupo.crear",
    detalle: "Creación de grupo",
    referencia: data.nombre,
  })
  revalidatePath("/config")
  return { ok: true }
}

export const editarGrupo = async (
  nombre: string,
  input: unknown,
): Promise<ActionResult> => {
  const usuario = await requirePermiso("config.editar")
  const parsed = grupoSchema.safeParse({ ...(input ?? {}), nombre })
  if (!parsed.success) return errorZod(parsed.error.issues[0]?.message)
  const data = parsed.data
  // No permitir quitar un subgrupo que tenga productos asignados (index.html:9611).
  const filas = await db
    .select({ sub: products.subGrupo })
    .from(products)
    .where(eq(products.grupo, nombre))
  const enUso = new Set(filas.map((f) => f.sub).filter((s): s is string => !!s))
  const removidos = [...enUso].filter((s) => !data.subgrupos.includes(s))
  if (removidos.length > 0)
    return {
      ok: false,
      error: `No se pueden quitar subgrupos con productos: ${removidos.join(", ")}`,
    }
  await db
    .update(groups)
    .set({ subgrupos: data.subgrupos })
    .where(eq(groups.nombre, nombre))
  await registrarAuditoria({
    usuario: usuario.id,
    accion: "grupo.editar",
    detalle: "Edición de grupo",
    referencia: nombre,
  })
  revalidatePath("/config")
  return { ok: true }
}

export const eliminarGrupo = async (nombre: string): Promise<ActionResult> => {
  const usuario = await requirePermiso("config.editar")
  const [{ n }] = await db
    .select({ n: count() })
    .from(products)
    .where(eq(products.grupo, nombre))
  if (n > 0)
    return {
      ok: false,
      error: `${n} producto(s) usan este grupo. Reasígnalos primero.`,
    }
  await db.delete(groups).where(eq(groups.nombre, nombre))
  await registrarAuditoria({
    usuario: usuario.id,
    accion: "grupo.eliminar",
    detalle: "Eliminación de grupo",
    referencia: nombre,
  })
  revalidatePath("/config")
  return { ok: true }
}

// --- Indicadores diarios ---
export const guardarIndicadores = async (
  input: unknown,
): Promise<ActionResult> => {
  const usuario = await requirePermiso("config.editar")
  const parsed = guardarIndicadoresSchema.safeParse(input)
  if (!parsed.success) return errorZod(parsed.error.issues[0]?.message)
  const { temporada, filas } = parsed.data
  const root = await getIndicadores()
  const merged = fusionarTemporada(root, temporada, construirMeses(filas))
  const valor = { ...merged, _updatedAt: new Date().toISOString() }
  await db
    .insert(config)
    .values({ clave: INDICADORES_KEY, valor })
    .onConflictDoUpdate({ target: config.clave, set: { valor } })
  await registrarAuditoria({
    usuario: usuario.id,
    accion: "config.indicadores.update",
    detalle: `Indicadores de la temporada ${temporada}`,
    referencia: temporada,
  })
  revalidatePath("/config")
  return { ok: true }
}
