import { asc } from "drizzle-orm"
import { db } from "@/db/client"
import { users } from "@/db/schema"
import type { UsuarioRow } from "@/types/usuarios.types"

// Listado de usuarios para la vista de Administración.
export const getUsuarios = async (): Promise<UsuarioRow[]> => {
  const rows = await db.select().from(users).orderBy(asc(users.nombre))
  return rows.map((u) => ({
    id: u.id,
    nombre: u.nombre,
    username: u.username ?? "",
    email: u.email,
    role: u.role,
    activo: u.activo,
    permissions: u.permissions,
  }))
}
