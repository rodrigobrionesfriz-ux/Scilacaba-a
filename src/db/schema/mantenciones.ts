import {
  date,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { providers } from "./maestros"

// Órdenes de trabajo / mantención (PK: id). Origen store: mantenciones
// `activo` = el equipo/máquina intervenido (string, no boolean). estado: Abierta | Cerrada.
// _mod (epoch ms) → updated_at. factura embebida (opcional) → jsonb.
export const maintenanceOrders = pgTable("maintenance_orders", {
  id: text("id").primaryKey(),
  numero: text("numero").notNull(),
  fecha: date("fecha").notNull(),
  categoria: text("categoria"),
  activo: text("activo"),
  descripcion: text("descripcion"),
  proveedorCodigo: text("proveedor_codigo").references(() => providers.codigo),
  total: numeric("total", { precision: 18, scale: 6 }).notNull().default("0"),
  estado: text("estado").notNull(),
  factura: jsonb("factura").$type<{
    numeroDoc?: string
    fecha?: string
    movimiento?: string
    horometro?: number
  }>(),
  creadoAt: timestamp("creado_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
})

// Líneas de OT. Origen: mantenciones.lineas[] — hijas → delete+reinsert por padre (cascade).
// productoCodigo como texto sin FK: las líneas "Mano de obra" no tienen producto, y el set
// legacy es irregular. Lo dejamos suelto (mismo criterio que maintenance no estricto).
export const maintenanceOrderLines = pgTable("maintenance_order_lines", {
  id: serial("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => maintenanceOrders.id, { onDelete: "cascade" }),
  tipo: text("tipo"),
  productoCodigo: text("producto_codigo"),
  productoNombre: text("producto_nombre"),
  detalle: text("detalle"),
  cantidad: numeric("cantidad", { precision: 18, scale: 4 })
    .notNull()
    .default("0"),
  valorUnit: numeric("valor_unit", { precision: 18, scale: 6 })
    .notNull()
    .default("0"),
})
