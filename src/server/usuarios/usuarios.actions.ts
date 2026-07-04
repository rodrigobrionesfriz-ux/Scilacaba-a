"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db/client"
import { accounts, users } from "@/db/schema"
import {
  crearUsuarioSchema,
  editarUsuarioSchema,
  resetPasswordSchema,
} from "@/schemas/usuarios.schema"
import { registrarAuditoria } from "@/server/audit/audit.core"
import { auth } from "@/server/auth/auth"
import { requirePermiso } from "@/server/auth/auth.queries"
import type { ActionResult } from "@/types/action.types"
import { esUltimoAdminActivo } from "@/utils/usuarios.utils"

const errorZod = (msg?: string): ActionResult => ({
  ok: false,
  error: msg ?? "Datos inválidos",
})

// Crea un usuario con credencial (mismo path que el seed: fila en users +
// linkAccount credential con la password inicial hasheada). El email se deriva
// del username (el login es por username, no por email).
export const crearUsuario = async (input: unknown): Promise<ActionResult> => {
  const actor = await requirePermiso("usuarios.crear")
  const parsed = crearUsuarioSchema.safeParse(input)
  if (!parsed.success) return errorZod(parsed.error.issues[0]?.message)
  const data = parsed.data
  const existe = await db.query.users.findFirst({
    where: eq(users.username, data.username),
  })
  if (existe)
    return { ok: false, error: "Ya existe un usuario con ese nombre de usuario" }

  const id = crypto.randomUUID()
  const context = await auth.$context
  const hash = await context.password.hash(data.password)
  await db.insert(users).values({
    id,
    nombre: data.nombre,
    username: data.username,
    displayUsername: data.username,
    email: `${data.username}@sci.local`,
    emailVerified: false,
    role: data.role,
    permissions: data.permissions,
    activo: true,
  })
  await context.internalAdapter.linkAccount({
    userId: id,
    providerId: "credential",
    accountId: id,
    password: hash,
  })
  await registrarAuditoria({
    usuario: actor.id,
    accion: "usuario.crear",
    detalle: `${data.nombre} (${data.role})`,
    referencia: data.username,
  })
  revalidatePath("/usuarios")
  return { ok: true }
}

export const editarUsuario = async (
  id: string,
  input: unknown,
): Promise<ActionResult> => {
  const actor = await requirePermiso("usuarios.crear")
  const parsed = editarUsuarioSchema.safeParse(input)
  if (!parsed.success) return errorZod(parsed.error.issues[0]?.message)
  const data = parsed.data

  const todos = await db
    .select({ id: users.id, role: users.role, activo: users.activo })
    .from(users)
  if (esUltimoAdminActivo(todos, id) && (data.role !== "admin" || !data.activo))
    return {
      ok: false,
      error:
        "No puedes quitar el rol admin ni desactivar al último administrador activo",
    }

  await db
    .update(users)
    .set({
      nombre: data.nombre,
      role: data.role,
      permissions: data.permissions,
      activo: data.activo,
      modificadoAt: new Date(),
    })
    .where(eq(users.id, id))
  await registrarAuditoria({
    usuario: actor.id,
    accion: "usuario.editar",
    detalle: `${data.nombre} (${data.role})`,
    referencia: id,
  })
  revalidatePath("/usuarios")
  return { ok: true }
}

export const resetearPassword = async (
  id: string,
  input: unknown,
): Promise<ActionResult> => {
  const actor = await requirePermiso("usuarios.crear")
  const parsed = resetPasswordSchema.safeParse(input)
  if (!parsed.success) return errorZod(parsed.error.issues[0]?.message)

  const context = await auth.$context
  const hash = await context.password.hash(parsed.data.password)
  const cuenta = await db.query.accounts.findFirst({
    where: and(eq(accounts.userId, id), eq(accounts.providerId, "credential")),
  })
  if (cuenta) {
    await db
      .update(accounts)
      .set({ password: hash, updatedAt: new Date() })
      .where(eq(accounts.id, cuenta.id))
  } else {
    await context.internalAdapter.linkAccount({
      userId: id,
      providerId: "credential",
      accountId: id,
      password: hash,
    })
  }
  await registrarAuditoria({
    usuario: actor.id,
    accion: "usuario.editar",
    detalle: "Contraseña restablecida",
    referencia: id,
  })
  revalidatePath("/usuarios")
  return { ok: true }
}

export const toggleActivo = async (id: string): Promise<ActionResult> => {
  const actor = await requirePermiso("usuarios.crear")
  const target = await db.query.users.findFirst({ where: eq(users.id, id) })
  if (!target) return { ok: false, error: "Usuario no encontrado" }
  const nuevoActivo = !target.activo
  if (!nuevoActivo) {
    const todos = await db
      .select({ id: users.id, role: users.role, activo: users.activo })
      .from(users)
    if (esUltimoAdminActivo(todos, id))
      return {
        ok: false,
        error: "No puedes desactivar al último administrador activo",
      }
  }
  await db
    .update(users)
    .set({ activo: nuevoActivo, modificadoAt: new Date() })
    .where(eq(users.id, id))
  await registrarAuditoria({
    usuario: actor.id,
    accion: "usuario.editar",
    detalle: nuevoActivo ? "Usuario activado" : "Usuario desactivado",
    referencia: id,
  })
  revalidatePath("/usuarios")
  return { ok: true }
}
