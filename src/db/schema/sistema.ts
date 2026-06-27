import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

// Usuarios de dominio (PK: id = email). Origen store: users
// role + permissions[] viven aquí (ADR-004). El passwordHash NO se migra:
// better-auth (Fase 2) gestiona credenciales; usuarios migran sin password → set-password.
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  role: text("role").notNull(),
  permissions: text("permissions").array().notNull().default([]),
  activo: boolean("activo").notNull().default(true),
  creadoAt: timestamp("creado_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  modificadoAt: timestamp("modificado_at", { withTimezone: true }),
})

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
