import { getSessionCookie } from "better-auth/cookies"
import { type NextRequest, NextResponse } from "next/server"

// Chequeo optimista de la cookie de sesión (sin tocar DB en el edge). La
// verificación autoritativa vive en el guard server de (app)/layout.tsx
// (requireAuth). El matcher excluye /login, /cambiar-password, /api/auth y estáticos.
// Next 16: el convention "middleware" se renombró a "proxy" (misma función).
export const proxy = (request: NextRequest) => {
  const sessionCookie = getSessionCookie(request)
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Excluye rutas de auth, internos de Next y cualquier estático (rutas con
    // extensión, p.ej. /logo-la-cabana.png) para no redirigirlos a /login.
    "/((?!api/auth|login|cambiar-password|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
}
