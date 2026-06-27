import "dotenv/config"
import { sql } from "drizzle-orm"
import { db } from "@/db/client"
import { fetchDocs } from "./firebase"
import { loadSci } from "./load"
import { recalcularStock } from "./recalc"
import { transformSci } from "./transform"
import { validar } from "./validate"

const main = async () => {
  console.log("1/4 Fetch Firebase...")
  const { sci } = await fetchDocs()
  console.log("2/4 Transform...")
  const filas = transformSci(sci)
  console.log("3/4 Load → develop...")
  await loadSci(filas)
  console.log("4/4 Recalcular PPP (stock + lotes)...")
  const recalc = await recalcularStock()

  const r = await db.execute(sql`select
      (select count(*) from products)::int productos,
      (select count(*) from movements)::int movimientos,
      (select count(*) from movement_lines)::int lineas,
      (select count(*) from stock)::int stock,
      (select count(*) from lots)::int lotes`)
  console.log("\n=== Conteos en develop ===")
  console.table(r.rows)

  const problemas = validar(sci, recalc)
  console.log(`\n=== Validación PPP: ${problemas.length} discrepancia(s) ===`)
  if (problemas.length) console.table(problemas.slice(0, 50))
  else console.log("✓ stock recalculado == stock origen (±0.0001)")
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("ERROR:", e)
    process.exit(1)
  })
