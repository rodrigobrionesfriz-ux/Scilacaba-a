import {
  boolean,
  date,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { products, warehouses } from "./maestros"

// Tomas de inventario (PK: id). Origen store: inventoryCounts
// estado (strings verbatim del monolito, así los guarda la data migrada):
//   EN_PROCESO → PENDIENTE_AUTORIZACION → (AUTORIZADA, transitorio) → APLICADA
//   ramas: DEVUELTA (vuelve a editable) y RECHAZADA (archivada sin efecto).
// alcance: conStock | todos. movimientosGenerados → text[] de números TIE/TIS.
export const inventoryCounts = pgTable("inventory_counts", {
  id: text("id").primaryKey(),
  numero: text("numero").notNull(),
  bodegaId: text("bodega_id")
    .notNull()
    .references(() => warehouses.id),
  estado: text("estado").notNull(),
  alcance: text("alcance").notNull(),
  filtroGrupo: text("filtro_grupo"),
  filtroTipo: text("filtro_tipo"),
  observaciones: text("observaciones"),
  usuario: text("usuario").notNull(),
  autorizadoPor: text("autorizado_por"),
  devolucionMotivo: text("devolucion_motivo"),
  rechazoMotivo: text("rechazo_motivo"),
  movimientosGenerados: text("movimientos_generados").array(),
  creadoAt: timestamp("creado_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  cerradoAt: timestamp("cerrado_at", { withTimezone: true }),
  cerradoPor: text("cerrado_por"),
  autorizadoAt: timestamp("autorizado_at", { withTimezone: true }),
  aplicadoAt: timestamp("aplicado_at", { withTimezone: true }),
  devolucionAt: timestamp("devolucion_at", { withTimezone: true }),
  devolucionPor: text("devolucion_por"),
  rechazoAt: timestamp("rechazo_at", { withTimezone: true }),
  rechazoPor: text("rechazo_por"),
})

// Líneas de toma (¡el origen las llama `lineas`, no `detalles`!). Origen: inventoryCounts.lineas[]
// Hijas de inventory_counts → delete+reinsert por padre (cascade), idempotente.
// fisico es nullable (el origen permite '' = sin ingresar); fisicoIngresado marca si se ingresó.
export const inventoryCountLines = pgTable("inventory_count_lines", {
  id: serial("id").primaryKey(),
  countId: text("count_id")
    .notNull()
    .references(() => inventoryCounts.id, { onDelete: "cascade" }),
  codigoInterno: text("codigo_interno")
    .notNull()
    .references(() => products.codigoInterno),
  descripcion: text("descripcion"),
  unidadMedida: text("unidad_medida"),
  manejaAtributos: boolean("maneja_atributos").notNull().default(false),
  loteId: text("lote_id"),
  lote: text("lote"),
  fechaVenc: date("fecha_venc"),
  teorico: numeric("teorico", { precision: 18, scale: 4 })
    .notNull()
    .default("0"),
  costoTeorico: numeric("costo_teorico", { precision: 18, scale: 6 })
    .notNull()
    .default("0"),
  fisico: numeric("fisico", { precision: 18, scale: 4 }),
  fisicoIngresado: boolean("fisico_ingresado").notNull().default(false),
  asumidoCero: boolean("asumido_cero").notNull().default(false),
})
