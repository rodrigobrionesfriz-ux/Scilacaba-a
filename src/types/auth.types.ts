import type { PERMISOS, ROLES } from "@/constants/permisos.constants"

// Clave de permiso (union de las 38 del catálogo).
export type Permiso = (typeof PERMISOS)[number][0]

// Rol de dominio (uno de los 6).
export type Rol = (typeof ROLES)[number]

// Usuario de dominio resuelto desde la sesión: identidad (better-auth) +
// autorización (role/permissions/activo de la tabla users). Lo arma
// getUsuarioActual() en src/server/auth.
export type UsuarioActual = {
  id: string
  nombre: string
  email: string
  role: string
  permissions: readonly string[]
  activo: boolean
}
