"use server"

import { db } from "@/db/client"
import {
  applicationConfirmations,
  applicationOrders,
  audit,
  budgetMeta,
  budgetRows,
  conteos,
  config,
  costCenters,
  counters,
  customers,
  estimaciones,
  fertirriegoConfig,
  fertirriegoOrdenes,
  fertirriegoSectores,
  fieldProducts,
  fieldRecords,
  groups,
  inventoryCountLines,
  inventoryCounts,
  invplantas,
  lots,
  maintenanceOrderLines,
  maintenanceOrders,
  movementLines,
  movements,
  panos,
  productTypes,
  products,
  providers,
  stock,
  users,
  warehouses,
} from "@/db/schema"
import { requireAdmin } from "@/server/auth/auth.queries"
import type { ExportResult } from "@/types/export.types"
import { construirBackup, serializarBackup } from "@/utils/backup.utils"

// Mapa nombre → tabla de dominio. Debe coincidir con BACKUP_TABLAS
// (backup.constants). Excluye accounts/sessions/verifications (credenciales) y
// migration_log a propósito.
const TABLAS = {
  productTypes,
  groups,
  warehouses,
  providers,
  customers,
  costCenters,
  products,
  movements,
  movementLines,
  stock,
  lots,
  inventoryCounts,
  inventoryCountLines,
  maintenanceOrders,
  maintenanceOrderLines,
  conteos,
  invplantas,
  estimaciones,
  panos,
  fieldRecords,
  fieldProducts,
  applicationOrders,
  applicationConfirmations,
  fertirriegoSectores,
  fertirriegoOrdenes,
  fertirriegoConfig,
  budgetRows,
  budgetMeta,
  users,
  counters,
  config,
  audit,
}

// Genera un respaldo JSON de todas las tablas de dominio (export-only, ADR-017).
// Solo admin. El restore se hace a nivel Postgres.
export const exportarBackupJson = async (): Promise<ExportResult> => {
  await requireAdmin()
  const fecha = new Date().toISOString()
  const tablas: Record<string, unknown[]> = {}
  for (const [nombre, tabla] of Object.entries(TABLAS)) {
    tablas[nombre] = await db.select().from(tabla)
  }
  const payload = construirBackup(fecha, tablas)
  const base64 = Buffer.from(serializarBackup(payload)).toString("base64")
  return {
    ok: true,
    base64,
    filename: `SCI_backup_${fecha.slice(0, 10)}.json`,
  }
}
