import { and, desc, eq, inArray, isNotNull, lt, ne, sql } from "drizzle-orm"
import {
  LOTE_VENCE_DIAS,
  MOVIMIENTOS_RECIENTES,
  STOCK_BAJO_TOP,
} from "@/constants/dashboard.constants"
import { db } from "@/db/client"
import {
  lots,
  movementLines,
  movements,
  products,
  stock,
  warehouses,
} from "@/db/schema"
import { getComprasUrgentes } from "@/server/compras-urgentes/compras-urgentes.queries"
import type {
  DashboardStats,
  MovimientoResumen,
  StockBajoRow,
} from "@/types/dashboard.types"
import { esStockBajo, labelProductoMovimiento } from "@/utils/dashboard.utils"

// Counts + valor inventario/servicios: agregados independientes → en paralelo.
const getCountsYValores = async () => {
  const [[totalProductos], [totalBodegas], [totalMovimientos], valores] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(products),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(warehouses)
        .where(eq(warehouses.activo, true)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(movements)
        .where(ne(movements.anulado, true)),
      db
        .select({
          inventariable: products.inventariable,
          valor: sql<string>`coalesce(sum(${stock.cantidad} * ${stock.costoPromedio}), 0)`,
        })
        .from(stock)
        .innerJoin(products, eq(stock.codigoInterno, products.codigoInterno))
        .groupBy(products.inventariable),
    ])

  const valorInventario = Number(
    valores.find((v) => v.inventariable)?.valor ?? 0,
  )
  const valorServicios = Number(
    valores.find((v) => !v.inventariable)?.valor ?? 0,
  )

  return {
    totalProductos: Number(totalProductos.count),
    totalBodegas: Number(totalBodegas.count),
    totalMovimientos: Number(totalMovimientos.count),
    valorInventario,
    valorServicios,
  }
}

// Stock bajo: productos cuya existencia total no supera el mínimo, con el
// detalle de existencias por bodega (o "Sin existencias" si no hay ninguna).
const getStockBajo = async (): Promise<{
  stockBajoCount: number
  stockBajo: StockBajoRow[]
}> => {
  const [prods, stockPorBodega] = await Promise.all([
    db
      .select({
        codigoInterno: products.codigoInterno,
        descripcion: products.descripcion,
        inventariable: products.inventariable,
        stockMinimo: products.stockMinimo,
      })
      .from(products),
    db
      .select({
        codigoInterno: stock.codigoInterno,
        bodega: warehouses.nombre,
        cantidad: stock.cantidad,
      })
      .from(stock)
      .leftJoin(warehouses, eq(stock.bodegaId, warehouses.id)),
  ])

  const bodegasPorProducto = new Map<
    string,
    { bodega: string; cantidad: number }[]
  >()
  const totalPorProducto = new Map<string, number>()
  for (const s of stockPorBodega) {
    const cantidad = Number(s.cantidad)
    totalPorProducto.set(
      s.codigoInterno,
      (totalPorProducto.get(s.codigoInterno) ?? 0) + cantidad,
    )
    const lista = bodegasPorProducto.get(s.codigoInterno) ?? []
    lista.push({ bodega: s.bodega ?? "", cantidad })
    bodegasPorProducto.set(s.codigoInterno, lista)
  }

  const filas: StockBajoRow[] = []
  let stockBajoCount = 0
  for (const p of prods) {
    const stockMinimo = Number(p.stockMinimo)
    const stockTotal = totalPorProducto.get(p.codigoInterno) ?? 0
    if (!esStockBajo(p.inventariable, stockMinimo, stockTotal)) continue

    stockBajoCount += 1
    const bodegas = bodegasPorProducto.get(p.codigoInterno)
    if (bodegas && bodegas.length > 0) {
      for (const b of bodegas) {
        filas.push({
          codigoInterno: p.codigoInterno,
          descripcion: p.descripcion,
          bodega: b.bodega,
          cantidad: b.cantidad,
          minimo: stockMinimo,
        })
      }
    } else {
      filas.push({
        codigoInterno: p.codigoInterno,
        descripcion: p.descripcion,
        bodega: "Sin existencias",
        cantidad: 0,
        minimo: stockMinimo,
      })
    }
  }

  return { stockBajoCount, stockBajo: filas.slice(0, STOCK_BAJO_TOP) }
}

// Lotes con saldo cuya fecha de vencimiento cae dentro de LOTE_VENCE_DIAS.
const getPorVencerCount = async (): Promise<number> => {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(lots)
    .where(
      and(
        sql`${lots.cantidad} > 0`,
        isNotNull(lots.fechaVenc),
        lt(
          lots.fechaVenc,
          sql`current_date + (${LOTE_VENCE_DIAS} * interval '1 day')`,
        ),
      ),
    )
  return Number(row.count)
}

// Últimos movimientos no anulados + primer producto de cada uno (para el label).
const getMovimientosRecientes = async (): Promise<MovimientoResumen[]> => {
  const recientes = await db
    .select({
      numero: movements.numero,
      tipoMovimiento: movements.tipoMovimiento,
      direccion: movements.direccion,
      fecha: movements.fecha,
      bodega: warehouses.nombre,
    })
    .from(movements)
    .leftJoin(warehouses, eq(movements.bodegaId, warehouses.id))
    .where(ne(movements.anulado, true))
    .orderBy(desc(movements.fecha))
    .limit(MOVIMIENTOS_RECIENTES)

  if (recientes.length === 0) return []

  const numeros = recientes.map((r) => r.numero)
  const lineas = await db
    .select({
      movementNumero: movementLines.movementNumero,
      id: movementLines.id,
      descripcion: products.descripcion,
      cantidad: movementLines.cantidad,
      costo: movementLines.costo,
    })
    .from(movementLines)
    .leftJoin(products, eq(movementLines.codigoInterno, products.codigoInterno))
    .where(inArray(movementLines.movementNumero, numeros))
    .orderBy(movementLines.movementNumero, movementLines.id)

  const agregadoPorMovimiento = new Map<
    string,
    { items: number; valor: number; primeraDescripcion: string }
  >()
  for (const l of lineas) {
    const actual = agregadoPorMovimiento.get(l.movementNumero)
    const valorLinea = Number(l.cantidad) * Number(l.costo)
    if (!actual) {
      agregadoPorMovimiento.set(l.movementNumero, {
        items: 1,
        valor: valorLinea,
        primeraDescripcion: l.descripcion ?? "",
      })
    } else {
      actual.items += 1
      actual.valor += valorLinea
    }
  }

  const aDireccion = (v: string): "ENT" | "SAL" => (v === "ENT" ? "ENT" : "SAL")

  return recientes.map((r) => {
    const agg = agregadoPorMovimiento.get(r.numero)
    return {
      numero: r.numero,
      tipoMovimiento: r.tipoMovimiento,
      direccion: aDireccion(r.direccion),
      fecha: r.fecha.toISOString(),
      bodega: r.bodega ?? "",
      producto: labelProductoMovimiento(
        agg?.primeraDescripcion ?? "",
        agg?.items ?? 0,
      ),
      items: agg?.items ?? 0,
      valor: agg?.valor ?? 0,
    }
  })
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const [
    countsYValores,
    { stockBajoCount, stockBajo },
    porVencerCount,
    movimientosRecientes,
    comprasUrgentes,
  ] = await Promise.all([
    getCountsYValores(),
    getStockBajo(),
    getPorVencerCount(),
    getMovimientosRecientes(),
    getComprasUrgentes(),
  ])

  return {
    ...countsYValores,
    stockBajoCount,
    stockBajo,
    porVencerCount,
    movimientosRecientes,
    comprasUrgentesCount: comprasUrgentes.length,
  }
}
