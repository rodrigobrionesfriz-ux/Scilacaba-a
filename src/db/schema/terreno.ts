import {
  bigint,
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

// Conteos en terreno (PK: id). Origen store: conteos. arboles[] → jsonb.
// pano_id referencia un paño del cuaderno (otro doc) → bigint sin FK (relación lógica, no dura).
// _mod → updated_at.
export const conteos = pgTable("conteos", {
  id: text("id").primaryKey(),
  panoId: bigint("pano_id", { mode: "number" }),
  panoNombre: text("pano_nombre"),
  variedad: text("variedad"),
  especie: text("especie"),
  etapa: text("etapa"),
  fijosCodigos: text("fijos_codigos").array(),
  usuario: text("usuario"),
  // Blob crudo del origen (captura offline): forma heterogénea entre versiones
  // de la app (p. ej. campo `precision` extra) → se preserva verbatim (SPEC: 100%).
  arboles: jsonb("arboles")
    .$type<Record<string, unknown>[]>()
    .notNull()
    .default([]),
  promedioCentros: numeric("promedio_centros", { precision: 18, scale: 4 }),
  nArboles: integer("n_arboles"),
  sincronizado: boolean("sincronizado").notNull().default(false),
  fechaInicio: timestamp("fecha_inicio", { withTimezone: true }).notNull(),
  fechaFin: timestamp("fecha_fin", { withTimezone: true }),
  fechaSync: timestamp("fecha_sync", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
})

// Inventario de huerto (PK: id). Origen store: invplantas. plantas[] → jsonb.
// estados de planta: sano | debil | muerto | replante | falta. gpsInicio/gpsFin → jsonb.
export const invplantas = pgTable("invplantas", {
  id: text("id").primaryKey(),
  cuartelId: bigint("cuartel_id", { mode: "number" }),
  cuartel: text("cuartel"),
  variedad: text("variedad"),
  portainjerto: text("portainjerto"),
  polinizante: text("polinizante"),
  hilera: text("hilera"),
  codigoBase: text("codigo_base"),
  usuario: text("usuario"),
  countPrincipal: integer("count_principal"),
  countPoliniz: integer("count_poliniz"),
  // En el origen `secuencia` es heterogénea: en unos registros es string[]
  // ("principal"/"poliniz") y en otros object[] ({tipo,estado}) → jsonb verbatim.
  secuencia: jsonb("secuencia").$type<unknown[]>(),
  gpsInicio: jsonb("gps_inicio").$type<Record<string, unknown>>(),
  gpsFin: jsonb("gps_fin").$type<Record<string, unknown>>(),
  // Blob crudo de plantas (offline): forma divergente entre versiones
  // ({seq,codigo,tipo,estado,lat,lng}) → se preserva verbatim (SPEC: 100%).
  plantas: jsonb("plantas")
    .$type<Record<string, unknown>[]>()
    .notNull()
    .default([]),
  sincronizado: boolean("sincronizado").notNull().default(false),
  fechaInicio: timestamp("fecha_inicio", { withTimezone: true }).notNull(),
  fechaSync: timestamp("fecha_sync", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
})

// Estimaciones de cosecha (PK: id). Origen store: estimaciones. lineas[] (cálculo por paño) → jsonb.
export const estimaciones = pgTable("estimaciones", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  usuario: text("usuario"),
  // Líneas de cálculo por paño (blob del origen) → verbatim (SPEC: 100%).
  lineas: jsonb("lineas")
    .$type<Record<string, unknown>[]>()
    .notNull()
    .default([]),
  totalKg: numeric("total_kg", { precision: 18, scale: 4 }),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
})
