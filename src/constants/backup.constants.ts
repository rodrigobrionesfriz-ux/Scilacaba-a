// Respaldo JSON (export-only, ADR-017). Versión del formato + lista canónica de
// tablas de dominio que entran en el respaldo. Hoja: no importa otras capas.
//
// EXCLUIDAS a propósito: accounts, sessions, verifications (credenciales/tokens
// de better-auth) y migration_log (bitácora operativa del migrador). El restore
// se hace a nivel Postgres (pg_dump / Railway), no en-app.
export const BACKUP_VERSION = 1

export const BACKUP_TABLAS = [
  "productTypes",
  "groups",
  "warehouses",
  "providers",
  "customers",
  "costCenters",
  "products",
  "movements",
  "movementLines",
  "stock",
  "lots",
  "inventoryCounts",
  "inventoryCountLines",
  "maintenanceOrders",
  "maintenanceOrderLines",
  "conteos",
  "invplantas",
  "estimaciones",
  "panos",
  "fieldRecords",
  "fieldProducts",
  "applicationOrders",
  "applicationConfirmations",
  "fertirriegoSectores",
  "fertirriegoOrdenes",
  "fertirriegoConfig",
  "budgetRows",
  "budgetMeta",
  "users",
  "counters",
  "config",
  "audit",
] as const
