import { and, asc, desc, eq, gt, inArray, sql } from "drizzle-orm"
import { db } from "@/db/client"
import {
  inventoryCountLines,
  inventoryCounts,
  lots,
  products,
  stock,
  warehouses,
} from "@/db/schema"
import type { Alcance, TomaDetalle, TomaLineaTeorica, TomaRow } from "@/types/tomas.types"
import {
  aAlcance,
  aEstadoToma,
  construirLineasTeoricas,
  type LoteToma,
  type ProductoToma,
  type StockToma,
} from "@/utils/tomas.utils"

// Listado de tomas con agregados de líneas (total / conteadas / con diferencia)
// precalculados en una sola query, sin N+1. Más recientes primero.
export const getTomas = async (): Promise<TomaRow[]> => {
  const [cabeceras, agregados] = await Promise.all([
    db
      .select({
        id: inventoryCounts.id,
        numero: inventoryCounts.numero,
        bodegaId: inventoryCounts.bodegaId,
        bodega: warehouses.nombre,
        estado: inventoryCounts.estado,
        alcance: inventoryCounts.alcance,
        usuario: inventoryCounts.usuario,
        creadoAt: inventoryCounts.creadoAt,
      })
      .from(inventoryCounts)
      .leftJoin(warehouses, eq(inventoryCounts.bodegaId, warehouses.id))
      .orderBy(desc(inventoryCounts.creadoAt)),
    db
      .select({
        countId: inventoryCountLines.countId,
        total: sql<number>`count(*)::int`,
        conteadas: sql<number>`count(*) filter (where ${inventoryCountLines.fisicoIngresado})::int`,
        conDiferencia: sql<number>`count(*) filter (where ${inventoryCountLines.fisicoIngresado} and ${inventoryCountLines.fisico} is distinct from ${inventoryCountLines.teorico})::int`,
      })
      .from(inventoryCountLines)
      .groupBy(inventoryCountLines.countId),
  ])

  const aggPorId = new Map(agregados.map((a) => [a.countId, a]))

  return cabeceras.map((c) => {
    const agg = aggPorId.get(c.id)
    return {
      id: c.id,
      numero: c.numero,
      bodegaId: c.bodegaId,
      bodega: c.bodega ?? "",
      estado: aEstadoToma(c.estado),
      alcance: aAlcance(c.alcance),
      usuario: c.usuario,
      totalLineas: agg?.total ?? 0,
      conteadas: agg?.conteadas ?? 0,
      conDiferencia: agg?.conDiferencia ?? 0,
      creadoAt: c.creadoAt.toISOString(),
    }
  })
}

// Detalle de una toma: cabecera + líneas ordenadas por descripción.
export const getToma = async (id: string): Promise<TomaDetalle | null> => {
  const cab = await db
    .select({
      id: inventoryCounts.id,
      numero: inventoryCounts.numero,
      bodegaId: inventoryCounts.bodegaId,
      bodega: warehouses.nombre,
      estado: inventoryCounts.estado,
      alcance: inventoryCounts.alcance,
      filtroGrupo: inventoryCounts.filtroGrupo,
      filtroTipo: inventoryCounts.filtroTipo,
      observaciones: inventoryCounts.observaciones,
      usuario: inventoryCounts.usuario,
      autorizadoPor: inventoryCounts.autorizadoPor,
      devolucionMotivo: inventoryCounts.devolucionMotivo,
      rechazoMotivo: inventoryCounts.rechazoMotivo,
      movimientosGenerados: inventoryCounts.movimientosGenerados,
      creadoAt: inventoryCounts.creadoAt,
      cerradoAt: inventoryCounts.cerradoAt,
      autorizadoAt: inventoryCounts.autorizadoAt,
      aplicadoAt: inventoryCounts.aplicadoAt,
    })
    .from(inventoryCounts)
    .leftJoin(warehouses, eq(inventoryCounts.bodegaId, warehouses.id))
    .where(eq(inventoryCounts.id, id))
    .limit(1)

  const c = cab[0]
  if (!c) return null

  const filas = await db
    .select()
    .from(inventoryCountLines)
    .where(eq(inventoryCountLines.countId, id))
    .orderBy(asc(inventoryCountLines.descripcion))

  return {
    id: c.id,
    numero: c.numero,
    bodegaId: c.bodegaId,
    bodega: c.bodega ?? "",
    estado: aEstadoToma(c.estado),
    alcance: aAlcance(c.alcance),
    filtroGrupo: c.filtroGrupo ?? "",
    filtroTipo: c.filtroTipo ?? "",
    observaciones: c.observaciones ?? "",
    usuario: c.usuario,
    autorizadoPor: c.autorizadoPor ?? "",
    devolucionMotivo: c.devolucionMotivo ?? "",
    rechazoMotivo: c.rechazoMotivo ?? "",
    movimientosGenerados: c.movimientosGenerados ?? [],
    creadoAt: c.creadoAt.toISOString(),
    cerradoAt: c.cerradoAt?.toISOString() ?? null,
    autorizadoAt: c.autorizadoAt?.toISOString() ?? null,
    aplicadoAt: c.aplicadoAt?.toISOString() ?? null,
    lineas: filas.map((l) => ({
      id: l.id,
      codigoInterno: l.codigoInterno,
      descripcion: l.descripcion ?? "",
      unidadMedida: l.unidadMedida ?? "",
      manejaAtributos: l.manejaAtributos,
      loteId: l.loteId,
      lote: l.lote,
      fechaVenc: l.fechaVenc,
      teorico: Number(l.teorico),
      costoTeorico: Number(l.costoTeorico),
      fisico: l.fisico === null ? null : Number(l.fisico),
      fisicoIngresado: l.fisicoIngresado,
      asumidoCero: l.asumidoCero,
    })),
  }
}

// Arma las líneas teóricas (snapshot stock+lotes) para iniciar una toma en una
// bodega, con filtros opcionales de grupo/tipo y alcance. Lógica de selección en
// el util puro construirLineasTeoricas; aquí solo se leen los datos.
export const getStockParaToma = async (
  bodegaId: string,
  opciones: { grupo?: string; tipo?: string; alcance: Alcance },
): Promise<TomaLineaTeorica[]> => {
  const condiciones = [eq(products.activo, true)]
  if (opciones.grupo) condiciones.push(eq(products.grupo, opciones.grupo))
  if (opciones.tipo) condiciones.push(eq(products.tipoProducto, opciones.tipo))

  const [prods, stockRows, lotRows] = await Promise.all([
    db
      .select({
        codigoInterno: products.codigoInterno,
        descripcion: products.descripcion,
        unidadMedida: products.unidadMedida,
        manejaAtributos: products.manejaAtributos,
      })
      .from(products)
      .where(and(...condiciones)),
    db
      .select({
        codigoInterno: stock.codigoInterno,
        cantidad: stock.cantidad,
        costoPromedio: stock.costoPromedio,
      })
      .from(stock)
      .where(eq(stock.bodegaId, bodegaId)),
    db
      .select({
        id: lots.id,
        codigoInterno: lots.codigoInterno,
        lote: lots.lote,
        fechaVenc: lots.fechaVenc,
        cantidad: lots.cantidad,
        costo: lots.costo,
      })
      .from(lots)
      .where(and(eq(lots.bodegaId, bodegaId), gt(lots.cantidad, "0"))),
  ])

  const productosToma: ProductoToma[] = prods.map((p) => ({
    codigoInterno: p.codigoInterno,
    descripcion: p.descripcion,
    unidadMedida: p.unidadMedida,
    manejaAtributos: p.manejaAtributos,
  }))

  const stockPorCodigo = new Map<string, StockToma>(
    stockRows.map((s) => [
      s.codigoInterno,
      { cantidad: Number(s.cantidad), costoPromedio: Number(s.costoPromedio) },
    ]),
  )

  const lotesPorCodigo = new Map<string, LoteToma[]>()
  for (const l of lotRows) {
    const arr = lotesPorCodigo.get(l.codigoInterno) ?? []
    arr.push({
      id: l.id,
      lote: l.lote,
      fechaVenc: l.fechaVenc,
      cantidad: Number(l.cantidad),
      costo: Number(l.costo),
    })
    lotesPorCodigo.set(l.codigoInterno, arr)
  }

  return construirLineasTeoricas(
    productosToma,
    stockPorCodigo,
    lotesPorCodigo,
    opciones.alcance,
  )
}

// ¿El usuario ya tiene una toma en curso (EN_PROCESO o DEVUELTA)? Guard del inicio
// (el monolito impide más de una abierta por operador a la vez).
export const getTomaEnCursoDeUsuario = async (
  usuario: string,
): Promise<string | null> => {
  const rows = await db
    .select({ numero: inventoryCounts.numero })
    .from(inventoryCounts)
    .where(
      and(
        eq(inventoryCounts.usuario, usuario),
        inArray(inventoryCounts.estado, ["EN_PROCESO", "DEVUELTA"]),
      ),
    )
    .limit(1)
  return rows[0]?.numero ?? null
}
