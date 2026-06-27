import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

// Sectores de riego (PK: id uid). Origen: cuaderno/main S.fertirriego.sectores[]
export const fertirriegoSectores = pgTable("fertirriego_sectores", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  equipo: text("equipo"),
  ha: numeric("ha", { precision: 18, scale: 4 }),
  variedad: text("variedad"),
  plantas: integer("plantas"),
})

// Órdenes de fertirriego (PK: id uid). Origen: cuaderno/main S.fertirriego.ordenes[]
// sectores = ids de fertirriego_sectores → text[]; lineas (productos) → jsonb.
export const fertirriegoOrdenes = pgTable("fertirriego_ordenes", {
  id: text("id").primaryKey(),
  numero: text("numero").notNull(),
  fecha: date("fecha"),
  forma: text("forma"),
  horario: text("horario"),
  estado: text("estado"),
  responsable: text("responsable"),
  sectores: text("sectores").array(),
  lineas: jsonb("lineas")
    .$type<
      Array<{
        prod: string
        dosis: number
        unidad: string
        obs: string
      }>
    >()
    .notNull()
    .default([]),
  confirmada: boolean("confirmada").notNull().default(false),
  confirmadaFecha: date("confirmada_fecha"),
  creadoAt: timestamp("creado_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
})

// Configuración de fertirriego (singleton). Origen: cuaderno/main S.fertirriego.cfg
// Una sola fila (id = "main"); listas editables y rangos de numeración por especie.
export const fertirriegoConfig = pgTable("fertirriego_config", {
  id: text("id").primaryKey().default("main"),
  cfg: jsonb("cfg").$type<{
    empresa?: string
    temporada?: string
    documento?: string
    obsDefecto?: string
    rangos: Array<{ especie: string; desde: number; hasta: number }>
    estados: string[]
    condiciones: string[]
    equipos: string[]
    formas: string[]
    unidades: string[]
    horarios: string[]
    tiposDoc: string[]
    predios: Array<{ predio: string; admin: string }>
  }>(),
})
