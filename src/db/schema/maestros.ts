import { boolean, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core"

// Tipos de producto (PK natural: nombre). Origen store: productTypes
export const productTypes = pgTable("product_types", {
  nombre: text("nombre").primaryKey(),
  descripcion: text("descripcion"),
  activo: boolean("activo").notNull().default(true),
  creadoAt: timestamp("creado_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  modificadoAt: timestamp("modificado_at", { withTimezone: true }),
})

// Grupos (PK natural: nombre). subgrupos es lista de strings. Origen: groups
export const groups = pgTable("groups", {
  nombre: text("nombre").primaryKey(),
  subgrupos: text("subgrupos").array().notNull().default([]),
})

// Bodegas (PK: id). esServicios → es_servicios. Origen: warehouses
export const warehouses = pgTable("warehouses", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  direccion: text("direccion"),
  esServicios: boolean("es_servicios").notNull().default(false),
  activo: boolean("activo").notNull().default(true),
  creadoAt: timestamp("creado_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Proveedores (PK: codigo = RUT sin DV). Origen: providers
export const providers = pgTable("providers", {
  codigo: text("codigo").primaryKey(),
  razonSocial: text("razon_social").notNull(),
  rut: text("rut"),
  giro: text("giro"),
  direccion: text("direccion"),
  comuna: text("comuna"),
  ciudad: text("ciudad"),
  telefono: text("telefono"),
  email: text("email"),
  contacto: text("contacto"),
  activo: boolean("activo").notNull().default(true),
  creadoAt: timestamp("creado_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  modificadoAt: timestamp("modificado_at", { withTimezone: true }),
})

// Clientes (PK: codigo = RUT sin DV). Misma forma que providers. Origen: customers
export const customers = pgTable("customers", {
  codigo: text("codigo").primaryKey(),
  razonSocial: text("razon_social").notNull(),
  rut: text("rut"),
  giro: text("giro"),
  direccion: text("direccion"),
  comuna: text("comuna"),
  ciudad: text("ciudad"),
  telefono: text("telefono"),
  email: text("email"),
  contacto: text("contacto"),
  activo: boolean("activo").notNull().default(true),
  creadoAt: timestamp("creado_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  modificadoAt: timestamp("modificado_at", { withTimezone: true }),
})

// Centros de costo (PK: codigo). Origen: costCenters
export const costCenters = pgTable("cost_centers", {
  codigo: text("codigo").primaryKey(),
  descripcion: text("descripcion").notNull(),
  area: text("area"),
  responsable: text("responsable"),
  observaciones: text("observaciones"),
  activo: boolean("activo").notNull().default(true),
  creadoAt: timestamp("creado_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  modificadoAt: timestamp("modificado_at", { withTimezone: true }),
})

// Productos (PK: codigo_interno). Origen: products
// grupo/tipoProducto/subGrupo se dejan como texto (etiquetas, igual que el monolito);
// los FK duros van en movement_lines/stock/lots, no en estos atributos de catálogo.
export const products = pgTable("products", {
  codigoInterno: text("codigo_interno").primaryKey(),
  codigoEan: text("codigo_ean"),
  descripcion: text("descripcion").notNull(),
  unidadMedida: text("unidad_medida").notNull(),
  tipoProducto: text("tipo_producto"),
  grupo: text("grupo"),
  subGrupo: text("sub_grupo"),
  manejaAtributos: boolean("maneja_atributos").notNull().default(false),
  inventariable: boolean("inventariable").notNull().default(true),
  stockMinimo: numeric("stock_minimo", { precision: 18, scale: 4 })
    .notNull()
    .default("0"),
  aplicaIva: boolean("aplica_iva").notNull().default(true),
  aplicaIec: boolean("aplica_iec").notNull().default(false),
  aplicaIla: boolean("aplica_ila").notNull().default(false),
  ccTipo: text("cc_tipo"),
  ccIngredienteActivo: text("cc_ingrediente_activo"),
  ccObjetivo: text("cc_objetivo"),
  ccDosis: numeric("cc_dosis", { precision: 18, scale: 4 }),
  ccUnidad: text("cc_unidad"),
  activo: boolean("activo").notNull().default(true),
  creadoAt: timestamp("creado_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  modificadoAt: timestamp("modificado_at", { withTimezone: true }),
})
