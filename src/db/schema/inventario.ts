import {
  boolean,
  date,
  numeric,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core"
import {
  costCenters,
  customers,
  products,
  providers,
  warehouses,
} from "./maestros"

// Movimientos (PK natural: numero correlativo). Origen store: movements
// tipo (ENT/SAL) → direccion; tipoMovimiento (COMPRA, VENTA, ...) → tipo_movimiento.
// usuario/autorizadoPor/tomaId quedan como texto por ahora (users vive en sistema.ts,
// inventory_counts en tomas.ts; evitamos referencias forward al escribir por grupos).
export const movements = pgTable("movements", {
  numero: text("numero").primaryKey(),
  direccion: text("direccion").notNull(),
  tipoMovimiento: text("tipo_movimiento").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  bodegaId: text("bodega_id")
    .notNull()
    .references(() => warehouses.id),
  bodegaDestinoId: text("bodega_destino_id").references(() => warehouses.id),
  documento: text("documento"),
  tipoDoc: text("tipo_doc"),
  numeroDoc: text("numero_doc"),
  proveedorCodigo: text("proveedor_codigo").references(() => providers.codigo),
  clienteCodigo: text("cliente_codigo").references(() => customers.codigo),
  centroCosto: text("centro_costo").references(() => costCenters.codigo),
  observaciones: text("observaciones"),
  usuario: text("usuario").notNull(),
  autorizadoPor: text("autorizado_por"),
  tomaId: text("toma_id"),
  tomaNumero: text("toma_numero"),
  anulado: boolean("anulado").notNull().default(false),
  creadoAt: timestamp("creado_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
})

// Líneas de movimiento (libro mayor del PPP). Origen: movements.detalles[]
// Hijas de movements → delete+reinsert por padre (onDelete cascade), idempotente.
export const movementLines = pgTable("movement_lines", {
  id: serial("id").primaryKey(),
  movementNumero: text("movement_numero")
    .notNull()
    .references(() => movements.numero, { onDelete: "cascade" }),
  codigoInterno: text("codigo_interno")
    .notNull()
    .references(() => products.codigoInterno),
  descripcion: text("descripcion"),
  unidadMedida: text("unidad_medida"),
  cantidad: numeric("cantidad", { precision: 18, scale: 4 }).notNull(),
  costo: numeric("costo", { precision: 18, scale: 6 }).notNull(),
  lote: text("lote"),
  fechaVenc: date("fecha_venc"),
  loteId: text("lote_id"),
})

// Stock actual (cache derivado de movement_lines vía PPP). PK compuesta (cod, bod).
// Se reconstruye entero post-carga; nunca se migra el crudo (solo para validar). Origen: stock
export const stock = pgTable(
  "stock",
  {
    codigoInterno: text("codigo_interno")
      .notNull()
      .references(() => products.codigoInterno),
    bodegaId: text("bodega_id")
      .notNull()
      .references(() => warehouses.id),
    cantidad: numeric("cantidad", { precision: 18, scale: 4 })
      .notNull()
      .default("0"),
    costoPromedio: numeric("costo_promedio", { precision: 18, scale: 6 })
      .notNull()
      .default("0"),
  },
  (t) => [primaryKey({ columns: [t.codigoInterno, t.bodegaId] })],
)

// Lotes (trazabilidad). id determinístico lot|cod|bod|lote + unique (cod, bod, lote)
// → recálculo idempotente (ADR-009). Origen: lots
export const lots = pgTable(
  "lots",
  {
    id: text("id").primaryKey(),
    codigoInterno: text("codigo_interno")
      .notNull()
      .references(() => products.codigoInterno),
    bodegaId: text("bodega_id")
      .notNull()
      .references(() => warehouses.id),
    lote: text("lote").notNull(),
    fechaVenc: date("fecha_venc"),
    cantidad: numeric("cantidad", { precision: 18, scale: 4 })
      .notNull()
      .default("0"),
    costo: numeric("costo", { precision: 18, scale: 6 }).notNull().default("0"),
  },
  (t) => [
    unique("lots_cod_bod_lote_uq").on(t.codigoInterno, t.bodegaId, t.lote),
  ],
)
