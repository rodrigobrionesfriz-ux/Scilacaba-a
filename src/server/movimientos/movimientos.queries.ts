import { asc, desc, eq, sql } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { db } from "@/db/client"
import {
  costCenters,
  customers,
  movementLines,
  movements,
  providers,
  warehouses,
} from "@/db/schema"
import type {
  MovimientoDetalle,
  MovimientoRow,
} from "@/types/movimientos.types"

const aDireccion = (v: string) => (v === "ENT" ? "ENT" : "SAL")

// Listado de movimientos con nombres de bodega/contraparte y totales por líneas.
// Orden cronológico inverso. Agregados de líneas en 1 query (sin N+1).
export const getMovimientos = async (): Promise<MovimientoRow[]> => {
  const bodegaDestino = alias(warehouses, "bodega_destino")
  const rows = await db
    .select({
      numero: movements.numero,
      fecha: movements.fecha,
      direccion: movements.direccion,
      tipoMovimiento: movements.tipoMovimiento,
      bodega: warehouses.nombre,
      bodegaDestino: bodegaDestino.nombre,
      proveedor: providers.razonSocial,
      cliente: customers.razonSocial,
      usuario: movements.usuario,
      anulado: movements.anulado,
    })
    .from(movements)
    .leftJoin(warehouses, eq(movements.bodegaId, warehouses.id))
    .leftJoin(bodegaDestino, eq(movements.bodegaDestinoId, bodegaDestino.id))
    .leftJoin(providers, eq(movements.proveedorCodigo, providers.codigo))
    .leftJoin(customers, eq(movements.clienteCodigo, customers.codigo))
    .orderBy(desc(movements.fecha), desc(movements.creadoAt))

  const agregados = await db
    .select({
      movementNumero: movementLines.movementNumero,
      totalLineas: sql<number>`count(*)::int`,
      valor: sql<string>`coalesce(sum(${movementLines.cantidad} * ${movementLines.costo}), 0)`,
    })
    .from(movementLines)
    .groupBy(movementLines.movementNumero)
  const porMov = new Map(agregados.map((a) => [a.movementNumero, a]))

  return rows.map((r) => {
    const agg = porMov.get(r.numero)
    return {
      numero: r.numero,
      fecha: r.fecha.toISOString(),
      direccion: aDireccion(r.direccion),
      tipoMovimiento: r.tipoMovimiento,
      bodega: r.bodega ?? "",
      bodegaDestino: r.bodegaDestino ?? "",
      contraparte: r.proveedor ?? r.cliente ?? "",
      totalLineas: agg ? Number(agg.totalLineas) : 0,
      valor: agg ? Number(agg.valor) : 0,
      usuario: r.usuario,
      anulado: r.anulado,
    }
  })
}

// Detalle de un movimiento (header + líneas) para la vista de detalle.
export const getMovimiento = async (
  numero: string,
): Promise<MovimientoDetalle | null> => {
  const bodegaDestino = alias(warehouses, "bodega_destino")
  const [m] = await db
    .select({
      numero: movements.numero,
      fecha: movements.fecha,
      direccion: movements.direccion,
      tipoMovimiento: movements.tipoMovimiento,
      bodega: warehouses.nombre,
      bodegaDestino: bodegaDestino.nombre,
      proveedor: providers.razonSocial,
      cliente: customers.razonSocial,
      centroCostoDesc: costCenters.descripcion,
      centroCostoCodigo: movements.centroCosto,
      documento: movements.documento,
      numeroDoc: movements.numeroDoc,
      observaciones: movements.observaciones,
      usuario: movements.usuario,
      autorizadoPor: movements.autorizadoPor,
      anulado: movements.anulado,
    })
    .from(movements)
    .leftJoin(warehouses, eq(movements.bodegaId, warehouses.id))
    .leftJoin(bodegaDestino, eq(movements.bodegaDestinoId, bodegaDestino.id))
    .leftJoin(providers, eq(movements.proveedorCodigo, providers.codigo))
    .leftJoin(customers, eq(movements.clienteCodigo, customers.codigo))
    .leftJoin(costCenters, eq(movements.centroCosto, costCenters.codigo))
    .where(eq(movements.numero, numero))
  if (!m) return null

  const lineas = await db
    .select()
    .from(movementLines)
    .where(eq(movementLines.movementNumero, numero))
    .orderBy(asc(movementLines.id))

  return {
    numero: m.numero,
    fecha: m.fecha.toISOString(),
    direccion: aDireccion(m.direccion),
    tipoMovimiento: m.tipoMovimiento,
    bodega: m.bodega ?? "",
    bodegaDestino: m.bodegaDestino ?? "",
    proveedor: m.proveedor ?? "",
    cliente: m.cliente ?? "",
    centroCosto: m.centroCostoDesc ?? m.centroCostoCodigo ?? "",
    documento: m.documento ?? "",
    numeroDoc: m.numeroDoc ?? "",
    observaciones: m.observaciones ?? "",
    usuario: m.usuario,
    autorizadoPor: m.autorizadoPor ?? "",
    anulado: m.anulado,
    lineas: lineas.map((l) => ({
      id: l.id,
      codigoInterno: l.codigoInterno,
      descripcion: l.descripcion ?? "",
      unidadMedida: l.unidadMedida ?? "",
      cantidad: Number(l.cantidad),
      costo: Number(l.costo),
      lote: l.lote ?? "",
      fechaVenc: l.fechaVenc ?? "",
    })),
  }
}
