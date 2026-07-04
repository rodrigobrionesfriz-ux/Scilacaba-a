import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import { db } from "@/db/client"
import { users } from "@/db/schema"
import type { Permiso, UsuarioActual } from "@/types/auth.types"
import { can } from "@/utils/permisos.utils"
import { auth } from "./auth"

// Sesión cruda de better-auth (identidad). null si no hay sesión válida.
// Memoizada por request con React.cache: los guards (layout, page, view, queries)
// la piden varias veces por render y así solo se valida contra la DB una vez.
export const getSesion = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
)

// Usuario de dominio resuelto: identidad (sesión) + autorización
// (role/permissions/activo leídos de la tabla users). null si no hay sesión.
// Memoizada por request (React.cache): deduplica el users.findFirst entre los
// múltiples requirePermiso/requireAuth de un mismo render.
export const getUsuarioActual = cache(
  async (): Promise<UsuarioActual | null> => {
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
  },
)

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

// Guard: exige rol admin (para módulos adminOnly como Auditoría y el respaldo,
// que no tienen permiso granular en el catálogo). Sin rol admin → dashboard.
export const requireAdmin = async (): Promise<UsuarioActual> => {
  const usuario = await requireAuth()
  if (usuario.role !== "admin") redirect("/dashboard")
  return usuario
}
