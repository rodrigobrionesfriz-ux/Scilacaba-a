import { sql } from "drizzle-orm"
import { db } from "@/db/client"
import {
  costCenters,
  customers,
  groups,
  movementLines,
  movements,
  productTypes,
  products,
  providers,
  users,
  warehouses,
} from "@/db/schema"
import type { FilasSci } from "./transform"

// Inserta solo si hay filas (drizzle .values([]) lanza con array vacío).
const insertarSiHay = async <T>(
  rows: T[],
  fn: (rows: T[]) => PromiseLike<unknown>,
) => {
  if (rows.length) await fn(rows)
}

// Carga idempotente del slice: TRUNCATE (re-correr converge) + insert en orden de FKs.
// stock y lots se truncan aquí pero los reconstruye el recálculo (paso siguiente).
export const loadSci = async (filas: FilasSci) => {
  await db.execute(sql`TRUNCATE TABLE
      movement_lines, movements, stock, lots, products, users,
      cost_centers, customers, providers, warehouses, groups, product_types
      RESTART IDENTITY CASCADE`)

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
  await insertarSiHay(filas.movements, (r) => db.insert(movements).values(r))
  await insertarSiHay(filas.movementLines, (r) =>
    db.insert(movementLines).values(r),
  )
}
