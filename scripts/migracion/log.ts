import { db } from "@/db/client"
import { migrationLog } from "@/db/schema"
import type { DocCrudo } from "./firebase"
import type { DocsCrudos } from "./transform"
import type { FilasMigracion } from "./transform"

// Largo de un array en payload[...path] (cuenta de origen, sin re-parsear schema).
const arrLen = (payload: unknown, ...path: string[]): number => {
  let cur: unknown = payload
  for (const k of path) {
    if (typeof cur !== "object" || cur === null) return 0
    cur = (cur as Record<string, unknown>)[k]
  }
  return Array.isArray(cur) ? cur.length : 0
}

type Entrada = {
  entidad: string
  source: DocCrudo
  sourceDoc: string
  countOrigen: number
  countDestino: number
}

// Una fila de migration_log por entidad por corrida (trazabilidad, migrator.md).
// countOrigen = largo del store en el doc; countDestino = filas efectivamente
// generadas (p. ej. products incluye placeholders → puede diferir del origen).
export const logMigracion = async (
  runId: string,
  docs: DocsCrudos,
  filas: FilasMigracion,
) => {
  const { sci, cuaderno, presupuesto } = docs
  const entradas: Entrada[] = [
    e("product_types", sci, "sci", arrLen(sci.payload, "productTypes"), filas.productTypes),
    e("groups", sci, "sci", arrLen(sci.payload, "groups"), filas.groups),
    e("warehouses", sci, "sci", arrLen(sci.payload, "warehouses"), filas.warehouses),
    e("providers", sci, "sci", arrLen(sci.payload, "providers"), filas.providers),
    e("customers", sci, "sci", arrLen(sci.payload, "customers"), filas.customers),
    e("cost_centers", sci, "sci", arrLen(sci.payload, "costCenters"), filas.costCenters),
    e("products", sci, "sci", arrLen(sci.payload, "products"), filas.products),
    e("users", sci, "sci", arrLen(sci.payload, "users"), filas.users),
    e("counters", sci, "sci", arrLen(sci.payload, "config"), filas.counters),
    e("config", sci, "sci", arrLen(sci.payload, "config"), filas.config),
    e("maintenance_orders", sci, "sci", arrLen(sci.payload, "mantenciones"), filas.maintenanceOrders),
    e("movements", sci, "sci", arrLen(sci.payload, "movements"), filas.movements),
    e("inventory_counts", sci, "sci", arrLen(sci.payload, "inventoryCounts"), filas.inventoryCounts),
    e("conteos", sci, "sci", arrLen(sci.payload, "conteos"), filas.conteos),
    e("invplantas", sci, "sci", arrLen(sci.payload, "invplantas"), filas.invplantas),
    e("estimaciones", sci, "sci", arrLen(sci.payload, "estimaciones"), filas.estimaciones),
    e("audit", sci, "sci", arrLen(sci.payload, "audit"), filas.audit),
    e("panos", cuaderno, "cuaderno", arrLen(cuaderno.payload, "panos"), filas.panos),
    e("field_records", cuaderno, "cuaderno", arrLen(cuaderno.payload, "registros"), filas.fieldRecords),
    e("field_products", cuaderno, "cuaderno", arrLen(cuaderno.payload, "productos"), filas.fieldProducts),
    e("application_orders", cuaderno, "cuaderno", arrLen(cuaderno.payload, "ordenes"), filas.applicationOrders),
    e("application_confirmations", cuaderno, "cuaderno", arrLen(cuaderno.payload, "confirmaciones"), filas.applicationConfirmations),
    e("fertirriego_sectores", cuaderno, "cuaderno", arrLen(cuaderno.payload, "fertirriego", "sectores"), filas.fertirriegoSectores),
    e("fertirriego_ordenes", cuaderno, "cuaderno", arrLen(cuaderno.payload, "fertirriego", "ordenes"), filas.fertirriegoOrdenes),
    e("budget_rows", presupuesto, "presupuesto", arrLen(presupuesto.payload, "rows"), filas.budgetRows),
  ]

  await db.insert(migrationLog).values(
    entradas.map((en) => ({
      runId,
      sourceDoc: en.sourceDoc,
      sourceVersion: en.source.version,
      entidad: en.entidad,
      countOrigen: en.countOrigen,
      countDestino: en.countDestino,
    })),
  )

  return entradas.map(({ entidad, countOrigen, countDestino }) => ({
    entidad,
    countOrigen,
    countDestino,
  }))
}

const e = (
  entidad: string,
  source: DocCrudo,
  sourceDoc: string,
  countOrigen: number,
  destino: unknown[],
): Entrada => ({
  entidad,
  source,
  sourceDoc,
  countOrigen,
  countDestino: destino.length,
})
