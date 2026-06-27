import {
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

// Filas presupuestarias (merge PPTO + REAL por mes/rubro). Origen: presupuesto/main payload.rows[]
// PK sintética: la clave natural (MES+AÑO+SUB+TIPO+DESC) tiene acentos/espacios y es frágil.
// Los alias MONTO PPTO / MONTO REAL del origen se omiten (duplican PPTO_CLP / REAL_CLP).
export const budgetRows = pgTable("budget_rows", {
  id: serial("id").primaryKey(),
  mes: text("mes").notNull(),
  anio: integer("anio"),
  subGrupo: text("sub_grupo"),
  tipoCosto: text("tipo_costo"),
  descripcion: text("descripcion"),
  temporada: text("temporada"),
  pptoClp: numeric("ppto_clp", { precision: 18, scale: 4 })
    .notNull()
    .default("0"),
  realClp: numeric("real_clp", { precision: 18, scale: 4 })
    .notNull()
    .default("0"),
  pptoUsd: numeric("ppto_usd", { precision: 18, scale: 4 })
    .notNull()
    .default("0"),
  realUsd: numeric("real_usd", { precision: 18, scale: 4 })
    .notNull()
    .default("0"),
  mesOrder: integer("mes_order"),
})

// Metadatos del dataset de presupuesto (singleton id="main"). Origen: payload.{detalle, monthsWithReal, kpis}
// El modelo del monolito es "reemplazar todo" al subir el Excel → un único registro de contexto.
export const budgetMeta = pgTable("budget_meta", {
  id: text("id").primaryKey().default("main"),
  detalle: jsonb("detalle").$type<Record<string, unknown>>(),
  monthsWithReal: text("months_with_real").array(),
  kpis: jsonb("kpis").$type<{
    kg: number | null
    tc: number | null
    ha: number | null
    kgEst: number | null
  }>(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
})
