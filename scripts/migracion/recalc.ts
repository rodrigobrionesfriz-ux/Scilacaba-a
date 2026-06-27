import { db } from "@/db/client"
import { lots, movementLines, movements, products, stock } from "@/db/schema"
import { recalcularPpp } from "@/lib/ppp"
import type {
  MovimientoLineaPpp,
  MovimientoPpp,
} from "@/types/movimientos.types"

// Lee movimientos+líneas+productos de la DB, recalcula PPP (función pura @/lib/ppp)
// y reescribe stock + lots (idempotente: borra y reinserta).
export const recalcularStock = async () => {
  const [movs, lineas, prods] = await Promise.all([
    db.select().from(movements),
    db.select().from(movementLines),
    db
      .select({
        codigoInterno: products.codigoInterno,
        manejaAtributos: products.manejaAtributos,
      })
      .from(products),
  ])

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

  const movimientos: MovimientoPpp[] = movs.map((m) => ({
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

  const { stock: stockCalc, lots: lotsCalc } = recalcularPpp(movimientos, prods)

  await db.delete(lots)
  await db.delete(stock)

  const stockRows = stockCalc.map((s) => ({
    codigoInterno: s.codigoInterno,
    bodegaId: s.bodegaId,
    cantidad: String(s.cantidad),
    costoPromedio: String(s.costoPromedio),
  }))
  const lotRows = lotsCalc.map((l) => ({
    id: l.id,
    codigoInterno: l.codigoInterno,
    bodegaId: l.bodegaId,
    lote: l.lote,
    fechaVenc: l.fechaVenc,
    cantidad: String(l.cantidad),
    costo: String(l.costo),
  }))
  if (stockRows.length) await db.insert(stock).values(stockRows)
  if (lotRows.length) await db.insert(lots).values(lotRows)

  return { stock: stockCalc, lots: lotsCalc }
}
