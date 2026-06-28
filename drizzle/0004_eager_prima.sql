ALTER TABLE "inventory_counts" ADD COLUMN "rechazo_motivo" text;--> statement-breakpoint
ALTER TABLE "inventory_counts" ADD COLUMN "cerrado_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "inventory_counts" ADD COLUMN "cerrado_por" text;--> statement-breakpoint
ALTER TABLE "inventory_counts" ADD COLUMN "devolucion_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "inventory_counts" ADD COLUMN "devolucion_por" text;--> statement-breakpoint
ALTER TABLE "inventory_counts" ADD COLUMN "rechazo_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "inventory_counts" ADD COLUMN "rechazo_por" text;