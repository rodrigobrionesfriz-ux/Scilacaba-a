type Autorizable = { role: string; permissions: readonly string[] }

// Autorización (ADR-004). admin tiene acceso total; el resto, según permissions[].
// Equivalente a can(perm) del monolito + atajo de admin. Acepta string porque la
// navegación es data-driven; los call sites de dominio usan el tipo Permiso vía
// requirePermiso (src/server/auth).
export const can = (
  user: Autorizable | null | undefined,
  permiso: string,
): boolean => {
  if (!user) return false
  if (user.role === "admin") return true
  return user.permissions.includes(permiso)
}

// Visibilidad de un ítem de navegación: adminOnly → solo admin; sin perm → visible;
// con perm → can(). Usado por el sidebar.
export const itemVisible = (
  user: Autorizable | null | undefined,
  item: { perm: string | null; adminOnly?: boolean },
): boolean => {
  if (!user) return false
  if (item.adminOnly) return user.role === "admin"
  if (item.perm === null) return true
  return can(user, item.perm)
}
