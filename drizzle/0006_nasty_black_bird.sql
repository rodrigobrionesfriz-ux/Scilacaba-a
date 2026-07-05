CREATE TABLE "equipos" (
	"id" bigint PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"capacidad" numeric(18, 4) NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application_orders" ADD COLUMN "equipo" text;--> statement-breakpoint
ALTER TABLE "application_orders" ADD COLUMN "equipo_cap" numeric(18, 4);--> statement-breakpoint
ALTER TABLE "application_orders" ADD COLUMN "n_estanques" integer;