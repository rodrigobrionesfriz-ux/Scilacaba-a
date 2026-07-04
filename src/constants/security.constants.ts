// Security headers de producción (Fase 12, hardening). Hoja: no importa otras
// capas. Se aplican a todas las rutas vía `headers()` en next.config.ts.

// Content-Security-Policy header-based (sin nonce): el nonce forzaría render
// dinámico global y rehacer el matcher del proxy → se difiere como endurecimiento
// futuro. `'unsafe-inline'` en script/style es necesario para el shell de Next y
// next/font; aceptable en una app interna autenticada (React escapa el output).
// Todos los recursos son mismo-origen: el SW (worker-src), la API de better-auth
// y los server actions (connect-src) y los assets. `data:`/`blob:` para imágenes
// y fuentes embebidas (react-pdf, mapas 2D, iconos).
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
]

export const CONTENT_SECURITY_POLICY = CSP_DIRECTIVES.join("; ")

// HSTS: 2 años + subdominios. Los navegadores ignoran HSTS sobre http (localhost),
// así que es inocuo en desarrollo. Sin `preload` (compromiso que requiere enviar
// el dominio a la lista y no aplica a un subdominio compartido de Railway).
export const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // geolocation=(self): Terreno (conteos/invplantas) captura GPS vía
  // navigator.geolocation → debe permitirse en el propio origen. Cámara y
  // micrófono no se usan → deshabilitados.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
]
