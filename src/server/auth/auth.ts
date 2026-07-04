import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { username } from "better-auth/plugins"
import {
  AUTH_RATE_LIMIT_MAX,
  AUTH_RATE_LIMIT_WINDOW_S,
  LOGIN_PATH,
  LOGIN_RATE_LIMIT_MAX,
  LOGIN_RATE_LIMIT_WINDOW_S,
  SESSION_COOKIE_CACHE_MAX_AGE,
} from "@/constants/auth.constants"
import { db } from "@/db/client"
import { accounts, sessions, users, verifications } from "@/db/schema"
import { env } from "@/lib/env"

// Instancia servidor de better-auth (ADR-004). Tabla única: la tabla `users` de
// dominio ES la tabla user de better-auth; sus columnas en español (nombre,
// creado_at, modificado_at) se remapean a los campos canónicos (name, createdAt,
// updatedAt). role/permissions/activo no los gestiona better-auth → se leen aparte
// en auth.queries (getUsuarioActual). Sin alta pública (disableSignUp); sin SMTP.
// Lee BETTER_AUTH_SECRET y BETTER_AUTH_URL del entorno.
export const auth = betterAuth({
  // Secret y baseURL explícitos desde el entorno validado (Fase 12): fuerza el
  // fallo temprano si faltan, en vez de la lectura implícita de process.env.
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  // Orígenes de confianza para CSRF: solo el dominio público del environment.
  trustedOrigins: [env.BETTER_AUTH_URL],
  // Rate limiting (hardening): tope global por IP en /api/auth + regla estricta
  // para el login (freno a fuerza bruta). Storage en memoria (Railway Hobby).
  rateLimit: {
    enabled: true,
    window: AUTH_RATE_LIMIT_WINDOW_S,
    max: AUTH_RATE_LIMIT_MAX,
    customRules: {
      [LOGIN_PATH]: {
        window: LOGIN_RATE_LIMIT_WINDOW_S,
        max: LOGIN_RATE_LIMIT_MAX,
      },
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  // Cache de sesión en cookie firmada: evita el hit a la tabla sessions en cada
  // navegación. No afecta a la autorización (role/permissions/activo se leen en
  // vivo de users en getUsuarioActual), solo difiere la revocación de sesión.
  session: {
    cookieCache: {
      enabled: true,
      maxAge: SESSION_COOKIE_CACHE_MAX_AGE,
    },
  },
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
