import { sql } from "drizzle-orm"
import { db } from "@/db/client"
import {
  applicationConfirmations,
  applicationOrders,
  audit,
  budgetMeta,
  budgetRows,
  config,
  conteos,
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
  maintenanceOrderLines,
  maintenanceOrders,
  movementLines,
  movements,
  panos,
  productTypes,
  products,
  providers,
  users,
  warehouses,
} from "@/db/schema"
import type { FilasMigracion } from "./transform"

// Inserta solo si hay filas (drizzle .values([]) lanza con array vacío).
const insertarSiHay = async <T>(
  rows: T[],
  fn: (rows: T[]) => PromiseLike<unknown>,
) => {
  if (rows.length) await fn(rows)
}

// Carga idempotente: TRUNCATE de todas las tablas de dominio (re-correr converge)
// + insert en orden de FKs (docs/migrator.md). stock y lots NO se cargan del
// origen: los reconstruye el recálculo (paso siguiente). migration_log se escribe
// aparte (log.ts) tras conocer los conteos.
export const loadAll = async (filas: FilasMigracion) => {
  await db.execute(sql`TRUNCATE TABLE
      application_confirmations, application_orders, field_records, field_products,
      fertirriego_ordenes, fertirriego_sectores, fertirriego_config,
      conteos, invplantas, estimaciones, panos,
      budget_rows, budget_meta, audit, config, counters,
      inventory_count_lines, inventory_counts,
      maintenance_order_lines, maintenance_orders,
      movement_lines, movements, stock, lots, products, users,
      cost_centers, customers, providers, warehouses, groups, product_types,
      migration_log
      RESTART IDENTITY CASCADE`)

  // 1-5: maestros
  await insertarSiHay(filas.productTypes, (r) =>
    db.insert(productTypes).values(r),
  )
  await insertarSiHay(filas.groups, (r) => db.insert(groups).values(r))
  await insertarSiHay(filas.warehouses, (r) => db.insert(warehouses).values(r))
  await insertarSiHay(filas.providers, (r) => db.insert(providers).values(r))
  await insertarSiHay(filas.customers, (r) => db.insert(customers).values(r))
  await insertarSiHay(filas.costCenters, (r) =>
    db.insert(costCenters).values(r),
  )
  await insertarSiHay(filas.products, (r) => db.insert(products).values(r))
  await insertarSiHay(filas.users, (r) => db.insert(users).values(r))

  // 6-7: sistema (counters + config)
  await insertarSiHay(filas.counters, (r) => db.insert(counters).values(r))
  await insertarSiHay(filas.config, (r) => db.insert(config).values(r))

  // 8: mantenciones
  await insertarSiHay(filas.maintenanceOrders, (r) =>
    db.insert(maintenanceOrders).values(r),
  )
  await insertarSiHay(filas.maintenanceOrderLines, (r) =>
    db.insert(maintenanceOrderLines).values(r),
  )

  // 9: movimientos (libro mayor del PPP)
  await insertarSiHay(filas.movements, (r) => db.insert(movements).values(r))
  await insertarSiHay(filas.movementLines, (r) =>
    db.insert(movementLines).values(r),
  )

  // 10: tomas
  await insertarSiHay(filas.inventoryCounts, (r) =>
    db.insert(inventoryCounts).values(r),
  )
  await insertarSiHay(filas.inventoryCountLines, (r) =>
    db.insert(inventoryCountLines).values(r),
  )

  // 11-13: cuaderno + terreno
  await insertarSiHay(filas.panos, (r) => db.insert(panos).values(r))
  await insertarSiHay(filas.fieldProducts, (r) =>
    db.insert(fieldProducts).values(r),
  )
  await insertarSiHay(filas.fieldRecords, (r) =>
    db.insert(fieldRecords).values(r),
  )
  await insertarSiHay(filas.applicationOrders, (r) =>
    db.insert(applicationOrders).values(r),
  )
  await insertarSiHay(filas.applicationConfirmations, (r) =>
    db.insert(applicationConfirmations).values(r),
  )
  await insertarSiHay(filas.conteos, (r) => db.insert(conteos).values(r))
  await insertarSiHay(filas.invplantas, (r) => db.insert(invplantas).values(r))
  await insertarSiHay(filas.estimaciones, (r) =>
    db.insert(estimaciones).values(r),
  )

  // 14: fertirriego
  await insertarSiHay(filas.fertirriegoSectores, (r) =>
    db.insert(fertirriegoSectores).values(r),
  )
  await insertarSiHay(filas.fertirriegoOrdenes, (r) =>
    db.insert(fertirriegoOrdenes).values(r),
  )
  await insertarSiHay(filas.fertirriegoConfig, (r) =>
    db.insert(fertirriegoConfig).values(r),
  )

  // 15: presupuesto
  await insertarSiHay(filas.budgetRows, (r) => db.insert(budgetRows).values(r))
  await insertarSiHay(filas.budgetMeta, (r) => db.insert(budgetMeta).values(r))

  // 16: auditoría
  await insertarSiHay(filas.audit, (r) => db.insert(audit).values(r))
}
