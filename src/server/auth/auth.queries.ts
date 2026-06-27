import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db/client"
import { users } from "@/db/schema"
import type { Permiso, UsuarioActual } from "@/types/auth.types"
import { can } from "@/utils/permisos.utils"
import { auth } from "./auth"

// Sesión cruda de better-auth (identidad). null si no hay sesión válida.
export const getSesion = async () =>
  auth.api.getSession({ headers: await headers() })

// Usuario de dominio resuelto: identidad (sesión) + autorización
// (role/permissions/activo leídos de la tabla users). null si no hay sesión.
export const getUsuarioActual = async (): Promise<UsuarioActual | null> => {
  const sesion = await getSesion()
  if (!sesion) return null
  const row = await db.query.users.findFirst({
    where: eq(users.id, sesion.user.id),
  })
  if (!row) return null
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    role: row.role,
    permissions: row.permissions,
    activo: row.activo,
  }
}

// Guard: exige sesión activa o redirige a /login. Para server components/actions.
export const requireAuth = async (): Promise<UsuarioActual> => {
  const usuario = await getUsuarioActual()
  if (!usuario || !usuario.activo) redirect("/login")
  return usuario
}

// Guard: exige un permiso concreto (ADR-004). Sin permiso → vuelve al dashboard.
export const requirePermiso = async (
  permiso: Permiso,
): Promise<UsuarioActual> => {
  const usuario = await requireAuth()
  if (!can(usuario, permiso)) redirect("/dashboard")
  return usuario
}
