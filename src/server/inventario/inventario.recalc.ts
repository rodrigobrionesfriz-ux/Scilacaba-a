import { inArray } from "drizzle-orm"
import { db } from "@/db/client"
import { lots, movementLines, movements, products, stock } from "@/db/schema"
import { recalcularPpp } from "@/lib/ppp"
import type {
  LotePpp,
  MovimientoLineaPpp,
  MovimientoPpp,
  StockPpp,
} from "@/types/movimientos.types"

// Handle de transacción de drizzle (mismo query builder que `db`). Tipado por
// inferencia para no usar any/as (regla 11). El recálculo corre dentro de la
// misma transacción que insertó/actualizó el movimiento (atomicidad ledger↔cache).
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

// Arma MovimientoPpp[] desde filas crudas (mismo mapeo que el migrador:
// Number(...) en numéricos y fechas a ISO para el orden cronológico estable).
const aMovimientosPpp = (
  movs: (typeof movements.$inferSelect)[],
  lineas: (typeof movementLines.$inferSelect)[],
): MovimientoPpp[] => {
  const lineasPorMov = new Map<string, MovimientoLineaPpp[]>()
  for (const l of lineas) {
    const arr = lineasPorMov.get(l.movementNumero) ?? []
    arr.push({
      codigoInterno: l.codigoInterno,
      cantidad: Number(l.cantidad),
      costo: Number(l.costo),
      lote: l.lote,
      fechaVenc: l.fechaVenc,
    })
    lineasPorMov.set(l.movementNumero, arr)
  }
  return movs.map((m) => ({
    numero: m.numero,
    direccion: m.direccion === "ENT" ? "ENT" : "SAL",
    tipoMovimiento: m.tipoMovimiento,
    fecha: m.fecha.toISOString(),
    creadoAt: m.creadoAt.toISOString(),
    bodegaId: m.bodegaId,
    bodegaDestinoId: m.bodegaDestinoId,
    anulado: m.anulado,
    lineas: lineasPorMov.get(m.numero) ?? [],
  }))
}

const aStockRows = (filas: StockPpp[]) =>
  filas.map((s) => ({
    codigoInterno: s.codigoInterno,
    bodegaId: s.bodegaId,
    cantidad: String(s.cantidad),
    costoPromedio: String(s.costoPromedio),
  }))

const aLotRows = (filas: LotePpp[]) =>
  filas.map((l) => ({
    id: l.id,
    codigoInterno: l.codigoInterno,
    bodegaId: l.bodegaId,
    lote: l.lote,
    fechaVenc: l.fechaVenc,
    cantidad: String(l.cantidad),
    costo: String(l.costo),
  }))

// Recálculo acotado a los productos afectados (ruta por-movimiento). Reproduce el
// historial completo de esos códigos vía la función pura @/lib/ppp y reescribe solo
// sus filas de stock/lots. Idempotente (PK [cod,bod] y lots.id determinístico).
export const recalcularStockScoped = async (tx: Tx, codigos: string[]) => {
  if (!codigos.length) return

  const lineasAfectadas = await tx
    .select()
    .from(movementLines)
    .where(inArray(movementLines.codigoInterno, codigos))

  // Sin movimientos para esos códigos: limpiar sus cachés y salir.
  const numeros = [...new Set(lineasAfectadas.map((l) => l.movementNumero))]
  if (!numeros.length) {
    await tx.delete(lots).where(inArray(lots.codigoInterno, codigos))
    await tx.delete(stock).where(inArray(stock.codigoInterno, codigos))
    return
  }

  const [movs, prods] = await Promise.all([
    tx.select().from(movements).where(inArray(movements.numero, numeros)),
    tx
      .select({
        codigoInterno: products.codigoInterno,
        manejaAtributos: products.manejaAtributos,
      })
      .from(products)
      .where(inArray(products.codigoInterno, codigos)),
  ])

  const { stock: stockCalc, lots: lotsCalc } = recalcularPpp(
    aMovimientosPpp(movs, lineasAfectadas),
    prods,
  )

  await tx.delete(lots).where(inArray(lots.codigoInterno, codigos))
  await tx.delete(stock).where(inArray(stock.codigoInterno, codigos))

  const stockRows = aStockRows(stockCalc)
  const lotRows = aLotRows(lotsCalc)
  if (stockRows.length) await tx.insert(stock).values(stockRows)
  if (lotRows.length) await tx.insert(lots).values(lotRows)
}

// Recálculo total del libro mayor (espejo del migrador: borra todo y reinserta).
// Para una futura acción de reparación. Reusa la misma matemática pura.
export const recalcularStockTotal = async (tx: Tx) => {
  const [movs, lineas, prods] = await Promise.all([
    tx.select().from(movements),
    tx.select().from(movementLines),
    tx
      .select({
        codigoInterno: products.codigoInterno,
        manejaAtributos: products.manejaAtributos,
      })
      .from(products),
  ])

  const { stock: stockCalc, lots: lotsCalc } = recalcularPpp(
    aMovimientosPpp(movs, lineas),
    prods,
  )

  await tx.delete(lots)
  await tx.delete(stock)

  const stockRows = aStockRows(stockCalc)
  const lotRows = aLotRows(lotsCalc)
  if (stockRows.length) await tx.insert(stock).values(stockRows)
  if (lotRows.length) await tx.insert(lots).values(lotRows)
}
