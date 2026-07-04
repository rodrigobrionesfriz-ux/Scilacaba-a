CREATE INDEX "movement_lines_movement_numero_idx" ON "movement_lines" USING btree ("movement_numero");--> statement-breakpoint
CREATE INDEX "movements_fecha_creado_idx" ON "movements" USING btree ("fecha","creado_at");--> statement-breakpoint
CREATE INDEX "stock_bodega_id_idx" ON "stock" USING btree ("bodega_id");--> statement-breakpoint
CREATE INDEX "inventory_count_lines_count_id_idx" ON "inventory_count_lines" USING btree ("count_id");