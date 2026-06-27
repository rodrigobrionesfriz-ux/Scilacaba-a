import "dotenv/config"
import { randomUUID } from "node:crypto"
import { sql } from "drizzle-orm"
import { db } from "@/db/client"
import { sciPayloadSchema } from "@/schemas/firestore-sci.schema"
import { fetchDocs } from "./firebase"
import { loadAll } from "./load"
import { logMigracion } from "./log"
import { recalcularStock } from "./recalc"
import { transformAll } from "./transform"
import { validarIntegridad, validarPpp, type Discrepancia } from "./validate"

const resumenPorTipo = (problemas: Discrepancia[]) => {
  const m = new Map<string, number>()
  for (const p of problemas) m.set(p.tipo, (m.get(p.tipo) ?? 0) + 1)
  return [...m].map(([tipo, n]) => ({ tipo, n }))
}

const main = async () => {
  const runId = randomUUID()
  console.log(`Migración run ${runId}`)

  console.log("1/5 Fetch Firebase (3 docs)...")
  const docs = await fetchDocs()
  console.log("2/5 Transform (todos los dominios)...")
  const filas = transformAll(docs)
  console.log("3/5 Load → DB (DATABASE_URL)...")
  await loadAll(filas)
  console.log("4/5 Recalcular PPP (stock + lotes)...")
  const recalc = await recalcularStock()
  console.log("5/5 migration_log + validación...")
  const conteos = await logMigracion(runId, docs, filas)

  console.log("\n=== Conteos por entidad (origen → destino) ===")
  console.table(conteos)

  const r = await db.execute(sql`select
      (select count(*) from products)::int productos,
      (select count(*) from movements)::int movimientos,
      (select count(*) from movement_lines)::int lineas,
      (select count(*) from stock)::int stock,
      (select count(*) from lots)::int lotes,
      (select count(*) from inventory_counts)::int tomas,
      (select count(*) from maintenance_orders)::int mantenciones,
      (select count(*) from panos)::int panos,
      (select count(*) from invplantas)::int invplantas,
      (select count(*) from conteos)::int conteos,
      (select count(*) from budget_rows)::int presupuesto,
      (select count(*) from audit)::int audit,
      (select count(*) from counters)::int counters,
      (select count(*) from config)::int config`)
  console.log("\n=== Conteos en DB destino ===")
  console.table(r.rows)

  const sciP = sciPayloadSchema.parse(docs.sci.payload ?? {})
  const ppp = validarPpp(docs.sci, recalc)
  const integridad = validarIntegridad(sciP, filas, conteos)
  const problemas = [...ppp, ...integridad]

  console.log(`\n=== Validación: ${problemas.length} discrepancia(s) ===`)
  if (ppp.length === 0) console.log("✓ PPP: stock recalculado == origen (±0.0001)")
  if (problemas.length) {
    console.table(resumenPorTipo(problemas))
    console.table(problemas.slice(0, 80))
  } else {
    console.log("✓ sin discrepancias")
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("ERROR:", e)
    process.exit(1)
  })
