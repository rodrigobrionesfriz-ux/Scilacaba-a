type MiniUsuario = { id: string; role: string; activo: boolean }

// ¿El usuario objetivo es el único admin activo? Se usa para bloquear que se le
// quite el rol admin o se le desactive (dejaría el sistema sin administrador).
export const esUltimoAdminActivo = (
  usuarios: MiniUsuario[],
  id: string,
): boolean => {
  const adminsActivos = usuarios.filter((u) => u.role === "admin" && u.activo)
  return adminsActivos.length === 1 && adminsActivos[0]?.id === id
}

// Normaliza un nombre de usuario (trim + minúsculas), consistente con el login.
export const normalizarUsername = (v: string): string => v.trim().toLowerCase()

// Permisos por defecto de un rol (para auto-marcar el grid al elegir rol). []
// si el rol no está en el mapa. `mapa` = ROLE_PERMS (se pasa para no acoplar el
// util a la constante y poder testearlo).
export const permisosDeRol = (
  mapa: Record<string, readonly string[]>,
  role: string,
): string[] => {
  const entry = Object.entries(mapa).find(([r]) => r === role)
  return entry ? [...entry[1]] : []
}
