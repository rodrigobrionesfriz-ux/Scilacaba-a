CREATE TABLE "cost_centers" (
	"codigo" text PRIMARY KEY NOT NULL,
	"descripcion" text NOT NULL,
	"area" text,
	"responsable" text,
	"observaciones" text,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modificado_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"codigo" text PRIMARY KEY NOT NULL,
	"razon_social" text NOT NULL,
	"rut" text,
	"giro" text,
	"direccion" text,
	"comuna" text,
	"ciudad" text,
	"telefono" text,
	"email" text,
	"contacto" text,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modificado_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"nombre" text PRIMARY KEY NOT NULL,
	"subgrupos" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_types" (
	"nombre" text PRIMARY KEY NOT NULL,
	"descripcion" text,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modificado_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "products" (
	"codigo_interno" text PRIMARY KEY NOT NULL,
	"codigo_ean" text,
	"descripcion" text NOT NULL,
	"unidad_medida" text NOT NULL,
	"tipo_producto" text,
	"grupo" text,
	"sub_grupo" text,
	"maneja_atributos" boolean DEFAULT false NOT NULL,
	"inventariable" boolean DEFAULT true NOT NULL,
	"stock_minimo" numeric(18, 4) DEFAULT '0' NOT NULL,
	"aplica_iva" boolean DEFAULT true NOT NULL,
	"aplica_iec" boolean DEFAULT false NOT NULL,
	"aplica_ila" boolean DEFAULT false NOT NULL,
	"cc_tipo" text,
	"cc_ingrediente_activo" text,
	"cc_objetivo" text,
	"cc_dosis" numeric(18, 4),
	"cc_unidad" text,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modificado_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"codigo" text PRIMARY KEY NOT NULL,
	"razon_social" text NOT NULL,
	"rut" text,
	"giro" text,
	"direccion" text,
	"comuna" text,
	"ciudad" text,
	"telefono" text,
	"email" text,
	"contacto" text,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modificado_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"direccion" text,
	"es_servicios" boolean DEFAULT false NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lots" (
	"id" text PRIMARY KEY NOT NULL,
	"codigo_interno" text NOT NULL,
	"bodega_id" text NOT NULL,
	"lote" text NOT NULL,
	"fecha_venc" date,
	"cantidad" numeric(18, 4) DEFAULT '0' NOT NULL,
	"costo" numeric(18, 6) DEFAULT '0' NOT NULL,
	CONSTRAINT "lots_cod_bod_lote_uq" UNIQUE("codigo_interno","bodega_id","lote")
);
--> statement-breakpoint
CREATE TABLE "movement_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"movement_numero" text NOT NULL,
	"codigo_interno" text NOT NULL,
	"descripcion" text,
	"unidad_medida" text,
	"cantidad" numeric(18, 4) NOT NULL,
	"costo" numeric(18, 6) NOT NULL,
	"lote" text,
	"fecha_venc" date,
	"lote_id" text
);
--> statement-breakpoint
CREATE TABLE "movements" (
	"numero" text PRIMARY KEY NOT NULL,
	"direccion" text NOT NULL,
	"tipo_movimiento" text NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"bodega_id" text NOT NULL,
	"bodega_destino_id" text,
	"documento" text,
	"tipo_doc" text,
	"numero_doc" text,
	"proveedor_codigo" text,
	"cliente_codigo" text,
	"centro_costo" text,
	"observaciones" text,
	"usuario" text NOT NULL,
	"autorizado_por" text,
	"toma_id" text,
	"toma_numero" text,
	"anulado" boolean DEFAULT false NOT NULL,
	"creado_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stock" (
	"codigo_interno" text NOT NULL,
	"bodega_id" text NOT NULL,
	"cantidad" numeric(18, 4) DEFAULT '0' NOT NULL,
	"costo_promedio" numeric(18, 6) DEFAULT '0' NOT NULL,
	CONSTRAINT "stock_codigo_interno_bodega_id_pk" PRIMARY KEY("codigo_interno","bodega_id")
);
--> statement-breakpoint
CREATE TABLE "inventory_count_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"count_id" text NOT NULL,
	"codigo_interno" text NOT NULL,
	"descripcion" text,
	"unidad_medida" text,
	"maneja_atributos" boolean DEFAULT false NOT NULL,
	"lote_id" text,
	"lote" text,
	"fecha_venc" date,
	"teorico" numeric(18, 4) DEFAULT '0' NOT NULL,
	"costo_teorico" numeric(18, 6) DEFAULT '0' NOT NULL,
	"fisico" numeric(18, 4),
	"fisico_ingresado" boolean DEFAULT false NOT NULL,
	"asumido_cero" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_counts" (
	"id" text PRIMARY KEY NOT NULL,
	"numero" text NOT NULL,
	"bodega_id" text NOT NULL,
	"estado" text NOT NULL,
	"alcance" text NOT NULL,
	"filtro_grupo" text,
	"filtro_tipo" text,
	"observaciones" text,
	"usuario" text NOT NULL,
	"autorizado_por" text,
	"devolucion_motivo" text,
	"movimientos_generados" text[],
	"creado_at" timestamp with time zone DEFAULT now() NOT NULL,
	"autorizado_at" timestamp with time zone,
	"aplicado_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "maintenance_order_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"tipo" text,
	"producto_codigo" text,
	"producto_nombre" text,
	"detalle" text,
	"cantidad" numeric(18, 4) DEFAULT '0' NOT NULL,
	"valor_unit" numeric(18, 6) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"numero" text NOT NULL,
	"fecha" date NOT NULL,
	"categoria" text,
	"activo" text,
	"descripcion" text,
	"proveedor_codigo" text,
	"total" numeric(18, 6) DEFAULT '0' NOT NULL,
	"estado" text NOT NULL,
	"factura" jsonb,
	"creado_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "conteos" (
	"id" text PRIMARY KEY NOT NULL,
	"pano_id" bigint,
	"pano_nombre" text,
	"variedad" text,
	"especie" text,
	"etapa" text,
	"fijos_codigos" text[],
	"usuario" text,
	"arboles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"promedio_centros" numeric(18, 4),
	"n_arboles" integer,
	"sincronizado" boolean DEFAULT false NOT NULL,
	"fecha_inicio" timestamp with time zone NOT NULL,
	"fecha_fin" timestamp with time zone,
	"fecha_sync" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "estimaciones" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"usuario" text,
	"lineas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_kg" numeric(18, 4),
	"fecha" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "invplantas" (
	"id" text PRIMARY KEY NOT NULL,
	"cuartel_id" bigint,
	"cuartel" text,
	"variedad" text,
	"portainjerto" text,
	"polinizante" text,
	"hilera" text,
	"codigo_base" text,
	"usuario" text,
	"count_principal" integer,
	"count_poliniz" integer,
	"secuencia" text[],
	"gps_inicio" jsonb,
	"gps_fin" jsonb,
	"plantas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sincronizado" boolean DEFAULT false NOT NULL,
	"fecha_inicio" timestamp with time zone NOT NULL,
	"fecha_sync" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "application_confirmations" (
	"id" bigint PRIMARY KEY NOT NULL,
	"orden_id" bigint,
	"orden_numero" text,
	"fecha_app" date,
	"hora_inicio" text,
	"hora_fin" text,
	"operador" text,
	"equipo" text,
	"turno" text,
	"temp_amb" numeric(18, 4),
	"humedad" numeric(18, 4),
	"viento" numeric(18, 4),
	"cond_clima" text,
	"pano_ids" text[],
	"productos_reales" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"agua_real" numeric(18, 4),
	"notas" text,
	"creada_at" timestamp with time zone,
	"creada_por" text
);
--> statement-breakpoint
CREATE TABLE "application_orders" (
	"id" bigint PRIMARY KEY NOT NULL,
	"numero" text NOT NULL,
	"fecha" date,
	"tipo_app" text,
	"fenologico" text,
	"objetivos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"objetivo_otro" text,
	"especie" text,
	"responsable" text,
	"metodo" text,
	"pano_ids" text[],
	"productos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"distribucion" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"producto" text,
	"dosis" numeric(18, 4),
	"unidad" text,
	"unit_s" text,
	"moj" numeric(18, 4),
	"vha" numeric(18, 4),
	"moj_t" numeric(18, 4),
	"notas" text,
	"t_has" numeric(18, 4),
	"t_agua" numeric(18, 4),
	"t_prod" numeric(18, 4),
	"margin" numeric(18, 4),
	"editada" boolean DEFAULT false NOT NULL,
	"editada_fecha" text,
	"editada_por" text,
	"creado_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_products" (
	"nombre" text PRIMARY KEY NOT NULL,
	"tipo" text,
	"unidad" text,
	"dosis" text,
	"ingrediente_activo" text,
	"objetivo" text,
	"aportes" jsonb
);
--> statement-breakpoint
CREATE TABLE "field_records" (
	"id" bigint PRIMARY KEY NOT NULL,
	"fecha" date,
	"pano_id" bigint,
	"tipo" text,
	"producto" text,
	"dosis" text,
	"unidad" text,
	"metodo" text,
	"operador" text,
	"obs" text,
	"lote" text
);
--> statement-breakpoint
CREATE TABLE "panos" (
	"id" bigint PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"variedad" text,
	"anio" text,
	"hectareas" numeric(18, 4),
	"has_riego" numeric(18, 4),
	"densidad" numeric(18, 4),
	"color" text,
	"tipo" text,
	"pano_padre" text,
	"plantas" integer,
	"deh" integer,
	"dsh" integer,
	"porta_injerto" text,
	"prod_pct" jsonb
);
--> statement-breakpoint
CREATE TABLE "fertirriego_config" (
	"id" text PRIMARY KEY DEFAULT 'main' NOT NULL,
	"cfg" jsonb
);
--> statement-breakpoint
CREATE TABLE "fertirriego_ordenes" (
	"id" text PRIMARY KEY NOT NULL,
	"numero" text NOT NULL,
	"fecha" date,
	"forma" text,
	"horario" text,
	"estado" text,
	"responsable" text,
	"sectores" text[],
	"lineas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"confirmada" boolean DEFAULT false NOT NULL,
	"confirmada_fecha" date,
	"creado_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fertirriego_sectores" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"equipo" text,
	"ha" numeric(18, 4),
	"variedad" text,
	"plantas" integer
);
--> statement-breakpoint
CREATE TABLE "budget_meta" (
	"id" text PRIMARY KEY DEFAULT 'main' NOT NULL,
	"detalle" jsonb,
	"months_with_real" text[],
	"kpis" jsonb,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "budget_rows" (
	"id" serial PRIMARY KEY NOT NULL,
	"mes" text NOT NULL,
	"anio" integer,
	"sub_grupo" text,
	"tipo_costo" text,
	"descripcion" text,
	"temporada" text,
	"ppto_clp" numeric(18, 4) DEFAULT '0' NOT NULL,
	"real_clp" numeric(18, 4) DEFAULT '0' NOT NULL,
	"ppto_usd" numeric(18, 4) DEFAULT '0' NOT NULL,
	"real_usd" numeric(18, 4) DEFAULT '0' NOT NULL,
	"mes_order" integer
);
--> statement-breakpoint
CREATE TABLE "audit" (
	"id" text PRIMARY KEY NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"usuario" text,
	"accion" text,
	"detalle" text,
	"referencia" text
);
--> statement-breakpoint
CREATE TABLE "config" (
	"clave" text PRIMARY KEY NOT NULL,
	"valor" jsonb
);
--> statement-breakpoint
CREATE TABLE "counters" (
	"clave" text PRIMARY KEY NOT NULL,
	"valor" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "migration_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"source_doc" text,
	"source_version" bigint,
	"entidad" text,
	"count_origen" integer,
	"count_destino" integer,
	"ts" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"role" text NOT NULL,
	"permissions" text[] DEFAULT '{}' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modificado_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "lots" ADD CONSTRAINT "lots_codigo_interno_products_codigo_interno_fk" FOREIGN KEY ("codigo_interno") REFERENCES "public"."products"("codigo_interno") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lots" ADD CONSTRAINT "lots_bodega_id_warehouses_id_fk" FOREIGN KEY ("bodega_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movement_lines" ADD CONSTRAINT "movement_lines_movement_numero_movements_numero_fk" FOREIGN KEY ("movement_numero") REFERENCES "public"."movements"("numero") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movement_lines" ADD CONSTRAINT "movement_lines_codigo_interno_products_codigo_interno_fk" FOREIGN KEY ("codigo_interno") REFERENCES "public"."products"("codigo_interno") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_bodega_id_warehouses_id_fk" FOREIGN KEY ("bodega_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_bodega_destino_id_warehouses_id_fk" FOREIGN KEY ("bodega_destino_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_proveedor_codigo_providers_codigo_fk" FOREIGN KEY ("proveedor_codigo") REFERENCES "public"."providers"("codigo") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_cliente_codigo_customers_codigo_fk" FOREIGN KEY ("cliente_codigo") REFERENCES "public"."customers"("codigo") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_centro_costo_cost_centers_codigo_fk" FOREIGN KEY ("centro_costo") REFERENCES "public"."cost_centers"("codigo") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock" ADD CONSTRAINT "stock_codigo_interno_products_codigo_interno_fk" FOREIGN KEY ("codigo_interno") REFERENCES "public"."products"("codigo_interno") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock" ADD CONSTRAINT "stock_bodega_id_warehouses_id_fk" FOREIGN KEY ("bodega_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_count_lines" ADD CONSTRAINT "inventory_count_lines_count_id_inventory_counts_id_fk" FOREIGN KEY ("count_id") REFERENCES "public"."inventory_counts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_count_lines" ADD CONSTRAINT "inventory_count_lines_codigo_interno_products_codigo_interno_fk" FOREIGN KEY ("codigo_interno") REFERENCES "public"."products"("codigo_interno") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_counts" ADD CONSTRAINT "inventory_counts_bodega_id_warehouses_id_fk" FOREIGN KEY ("bodega_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_order_lines" ADD CONSTRAINT "maintenance_order_lines_order_id_maintenance_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."maintenance_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_orders" ADD CONSTRAINT "maintenance_orders_proveedor_codigo_providers_codigo_fk" FOREIGN KEY ("proveedor_codigo") REFERENCES "public"."providers"("codigo") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_confirmations" ADD CONSTRAINT "application_confirmations_orden_id_application_orders_id_fk" FOREIGN KEY ("orden_id") REFERENCES "public"."application_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_records" ADD CONSTRAINT "field_records_pano_id_panos_id_fk" FOREIGN KEY ("pano_id") REFERENCES "public"."panos"("id") ON DELETE no action ON UPDATE no action;