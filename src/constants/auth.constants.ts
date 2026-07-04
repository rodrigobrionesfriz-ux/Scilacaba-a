// Constantes de autenticación (regla 7). Hoja: no importa otras capas.

// Vida del cache de sesión en cookie firmada (better-auth). Mientras la cookie
// esté fresca, getSession se resuelve sin pegarle a la tabla sessions. Corto a
// propósito: acota la ventana en que una sesión revocada sigue viva (la
// autorización —role/permissions/activo— se lee siempre en vivo de users).
export const SESSION_COOKIE_CACHE_MAX_AGE = 60 * 5

// Rate limiting de better-auth (Fase 12, hardening). Ventana y tope global de
// requests a /api/auth por IP, más una regla estricta para el login (freno a
// fuerza bruta de credenciales). Storage en memoria (una sola instancia en
// Railway Hobby); escalar a múltiples réplicas exigiría storage "database".
export const AUTH_RATE_LIMIT_WINDOW_S = 60
export const AUTH_RATE_LIMIT_MAX = 60

// Login por username: path del endpoint del plugin `username` de better-auth
// (relativo a /api/auth). Se le aplica un tope más bajo que el global.
export const LOGIN_PATH = "/sign-in/username"
export const LOGIN_RATE_LIMIT_WINDOW_S = 60
export const LOGIN_RATE_LIMIT_MAX = 8
