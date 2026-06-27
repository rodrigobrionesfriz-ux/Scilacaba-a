import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

// Usuarios (PK: id = email para migrados; nuevos reciben id generado por
// better-auth). Es la tabla `user` de better-auth (ADR-004, tabla única): identidad
// (email/emailVerified/image, nombre↔name, creadoAt↔createdAt, modificadoAt↔updatedAt
// se remapean en src/server/auth/auth.ts) + autorización de dominio
// (role/permissions/activo, que better-auth no gestiona). El login resuelve por email.
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  // Identificador de login (plugin username de better-auth). El origen usa usuarios
  // (no emails): el login es por username, no por email. email se conserva porque el
  // modelo user de better-auth lo exige (= id para los migrados).
  username: text("username").unique(),
  displayUsername: text("display_username"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("consulta"),
  permissions: text("permissions").array().notNull().default([]),
  activo: boolean("activo").notNull().default(true),
  creadoAt: timestamp("creado_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  modificadoAt: timestamp("modificado_at", { withTimezone: true }),
})

// --- Tablas de better-auth (esquema canónico del adapter Drizzle, ADR-004) ---

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
)

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("accounts_user_id_idx").on(t.userId)],
)

export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
)

// Correlativos transaccionales sin huecos (PK: clave). Origen: config 'counters' + productCounter
// + oCounter (cuaderno, clave "OA") + fertirriego.oCounter (clave "OAF").
// Sembrados desde config y reajustados al max real usado (migrator.md validación 5).
export const counters = pgTable("counters", {
  clave: text("clave").primaryKey(),
  valor: integer("valor").notNull().default(0),
})

// Configuración general (PK: clave). Origen: config (menos counters/productCounter → tabla counters)
// Entradas: empresa, lastBackup, tombstones, etc. Valor heterogéneo → jsonb.
export const config = pgTable("config", {
  clave: text("clave").primaryKey(),
  valor: jsonb("valor").$type<Record<string, unknown>>(),
})

// Auditoría (PK: id). Origen store: audit
export const audit = pgTable("audit", {
  id: text("id").primaryKey(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  usuario: text("usuario"),
  accion: text("accion"),
  detalle: text("detalle"),
  referencia: text("referencia"),
})

// Trazabilidad del migrador (migrator.md): una fila por entidad por corrida.
export const migrationLog = pgTable("migration_log", {
  id: serial("id").primaryKey(),
  runId: text("run_id").notNull(),
  sourceDoc: text("source_doc"),
  sourceVersion: bigint("source_version", { mode: "number" }),
  entidad: text("entidad"),
  countOrigen: integer("count_origen"),
  countDestino: integer("count_destino"),
  ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
})
