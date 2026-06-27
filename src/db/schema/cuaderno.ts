import {
  bigint,
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

// Paños / cuarteles (PK: id epoch-ms). Origen: cuaderno/main S.panos[]
// prodPct opcional sobrescribe el global S.prodPorEstado para ese paño.
export const panos = pgTable("panos", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  nombre: text("nombre").notNull(),
  variedad: text("variedad"),
  anio: text("anio"),
  hectareas: numeric("hectareas", { precision: 18, scale: 4 }),
  hasRiego: numeric("has_riego", { precision: 18, scale: 4 }),
  densidad: numeric("densidad", { precision: 18, scale: 4 }),
  color: text("color"),
  tipo: text("tipo"),
  panoPadre: text("pano_padre"),
  plantas: integer("plantas"),
  deh: integer("deh"),
  dsh: integer("dsh"),
  portaInjerto: text("porta_injerto"),
  prodPct: jsonb("prod_pct").$type<{
    sano: number
    debil: number
    replante: number
    muerto: number
    falta: number
  }>(),
})

// Registros de campo (un registro por paño). Origen: cuaderno/main S.registros[]
// dosis se conserva como texto (el origen mezcla string/number libremente).
export const fieldRecords = pgTable("field_records", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  fecha: date("fecha"),
  panoId: bigint("pano_id", { mode: "number" }).references(() => panos.id),
  tipo: text("tipo"),
  producto: text("producto"),
  dosis: text("dosis"),
  unidad: text("unidad"),
  metodo: text("metodo"),
  operador: text("operador"),
  obs: text("obs"),
  lote: text("lote"),
})

// Catálogo de productos del cuaderno (PK: nombre). Origen: cuaderno/main S.productos[]
// aportes = dict {nutriente: %peso} usado en fertirriego.
export const fieldProducts = pgTable("field_products", {
  nombre: text("nombre").primaryKey(),
  tipo: text("tipo"),
  unidad: text("unidad"),
  dosis: text("dosis"),
  ingredienteActivo: text("ingrediente_activo"),
  objetivo: text("objetivo"),
  aportes: jsonb("aportes").$type<Record<string, number>>(),
})

// Órdenes de aplicación (PK: id epoch-ms). Origen: cuaderno/main S.ordenes[]
// pano_ids → text[]; productos/distribucion/objetivos → jsonb (migrator.md).
// Campos legacy (producto/dosis/unidad/unitS) = primer producto, compat hacia atrás.
export const applicationOrders = pgTable("application_orders", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  numero: text("numero").notNull(),
  fecha: date("fecha"),
  tipoApp: text("tipo_app"),
  fenologico: text("fenologico"),
  objetivos: jsonb("objetivos").$type<string[]>().notNull().default([]),
  objetivoOtro: text("objetivo_otro"),
  especie: text("especie"),
  responsable: text("responsable"),
  metodo: text("metodo"),
  panoIds: text("pano_ids").array(),
  productos: jsonb("productos")
    .$type<
      Array<{
        nombre: string
        dosis: number
        unidad: string
        unitS: string
        tProd?: number
        margin?: number
      }>
    >()
    .notNull()
    .default([]),
  distribucion: jsonb("distribucion")
    .$type<
      Array<{
        panoId: number
        panoNombre: string
        variedad: string
        anio: string
        color: string
        has: number
        agua: number
        prod: number
        prods: Array<{
          nombre: string
          qty: number
          unitS: string
          unidad: string
          dosis: number
        }>
      }>
    >()
    .notNull()
    .default([]),
  producto: text("producto"),
  dosis: numeric("dosis", { precision: 18, scale: 4 }),
  unidad: text("unidad"),
  unitS: text("unit_s"),
  moj: numeric("moj", { precision: 18, scale: 4 }),
  vha: numeric("vha", { precision: 18, scale: 4 }),
  mojT: numeric("moj_t", { precision: 18, scale: 4 }),
  notas: text("notas"),
  tHas: numeric("t_has", { precision: 18, scale: 4 }),
  tAgua: numeric("t_agua", { precision: 18, scale: 4 }),
  tProd: numeric("t_prod", { precision: 18, scale: 4 }),
  margin: numeric("margin", { precision: 18, scale: 4 }),
  editada: boolean("editada").notNull().default(false),
  editadaFecha: text("editada_fecha"),
  editadaPor: text("editada_por"),
  creadoAt: timestamp("creado_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Confirmaciones de aplicación (PK: id epoch-ms). Origen: cuaderno/main S.confirmaciones[]
export const applicationConfirmations = pgTable("application_confirmations", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  ordenId: bigint("orden_id", { mode: "number" }).references(
    () => applicationOrders.id,
  ),
  ordenNumero: text("orden_numero"),
  fechaApp: date("fecha_app"),
  horaInicio: text("hora_inicio"),
  horaFin: text("hora_fin"),
  operador: text("operador"),
  equipo: text("equipo"),
  turno: text("turno"),
  tempAmb: numeric("temp_amb", { precision: 18, scale: 4 }),
  humedad: numeric("humedad", { precision: 18, scale: 4 }),
  viento: numeric("viento", { precision: 18, scale: 4 }),
  condClima: text("cond_clima"),
  panoIds: text("pano_ids").array(),
  productosReales: jsonb("productos_reales")
    .$type<
      Array<{
        nombre: string
        qtyAplicada: number
        unitS: string
        planeado: number
        planeadoUS: string
        factor: number
      }>
    >()
    .notNull()
    .default([]),
  aguaReal: numeric("agua_real", { precision: 18, scale: 4 }),
  notas: text("notas"),
  creadaAt: timestamp("creada_at", { withTimezone: true }),
  creadaPor: text("creada_por"),
})
