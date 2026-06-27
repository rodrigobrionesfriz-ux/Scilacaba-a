import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { username } from "better-auth/plugins"
import { db } from "@/db/client"
import { accounts, sessions, users, verifications } from "@/db/schema"

// Instancia servidor de better-auth (ADR-004). Tabla única: la tabla `users` de
// dominio ES la tabla user de better-auth; sus columnas en español (nombre,
// creado_at, modificado_at) se remapean a los campos canónicos (name, createdAt,
// updatedAt). role/permissions/activo no los gestiona better-auth → se leen aparte
// en auth.queries (getUsuarioActual). Sin alta pública (disableSignUp); sin SMTP.
// Lee BETTER_AUTH_SECRET y BETTER_AUTH_URL del entorno.
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  user: {
    fields: {
      name: "nombre",
      createdAt: "creadoAt",
      updatedAt: "modificadoAt",
    },
  },
  // username: el origen usa usuarios (no emails) → login por username.
  // nextCookies debe ir último.
  plugins: [username(), nextCookies()],
})

export type SessionUser = typeof auth.$Infer.Session.user
