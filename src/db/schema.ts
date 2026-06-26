import { pgTable, serial, timestamp } from "drizzle-orm/pg-core"

// PLACEHOLDER Fase 0: prueba el pipeline de migraciones.
// Se reemplaza por el schema real en Fase 1.
export const health = pgTable("_health", {
  id: serial("id").primaryKey(),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
})
