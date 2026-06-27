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
  arboles: jsonb("arboles")
    .$type<
      Array<{
        n: number
        centros: number
        tipo: string
        codigo: string
        lat?: number
        lng?: number
        fecha?: string
      }>
    >()
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
  secuencia: text("secuencia").array(),
  gpsInicio: jsonb("gps_inicio").$type<{
    lat: number
    lng: number
    precision?: number
    hora?: string
  }>(),
  gpsFin: jsonb("gps_fin").$type<{
    lat: number
    lng: number
    precision?: number
    hora?: string
  }>(),
  plantas: jsonb("plantas")
    .$type<
      Array<{
        n: number
        estado: "sano" | "debil" | "muerto" | "replante" | "falta"
        codigo: string
        lat?: number
        lng?: number
      }>
    >()
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
  lineas: jsonb("lineas")
    .$type<
      Array<{
        panoId: number
        panoNombre: string
        variedad: string
        plantas: number
        plantasEquiv?: number | null
        plantasInvTotal?: number | null
        usarEquiv: boolean
        centros: number
        tieneCont: boolean
        frutosCentro: number
        kgFruto: number
        plantasUsadas?: number
        kgPano: number
      }>
    >()
    .notNull()
    .default([]),
  totalKg: numeric("total_kg", { precision: 18, scale: 4 }),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
})
