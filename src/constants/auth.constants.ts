// Constantes de autenticación (regla 7). Hoja: no importa otras capas.

// Vida del cache de sesión en cookie firmada (better-auth). Mientras la cookie
// esté fresca, getSession se resuelve sin pegarle a la tabla sessions. Corto a
// propósito: acota la ventana en que una sesión revocada sigue viva (la
// autorización —role/permissions/activo— se lee siempre en vivo de users).
export const SESSION_COOKIE_CACHE_MAX_AGE = 60 * 5
