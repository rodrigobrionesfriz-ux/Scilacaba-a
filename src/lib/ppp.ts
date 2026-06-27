import { TRASPASO_BODEGA } from "@/constants/movimientos.constants"
import type {
  LotePpp,
  MovimientoPpp,
  ProductoAtributos,
  ResultadoPpp,
  StockPpp,
} from "@/types/movimientos.types"

// clave de stock: cod|bod  ·  clave de lote: cod|bod|lote
const stockKey = (cod: string, bod: string) => `${cod}|${bod}`
const lotKey = (cod: string, bod: string, lote: string) =>
  `${cod}|${bod}|${lote}`

// Orden cronológico estable: fecha, luego creadoAt, luego numero (igual que el monolito).
const ordenarCronologico = (a: MovimientoPpp, b: MovimientoPpp) => {
  const fa = `${a.fecha ?? ""}${a.creadoAt ?? ""}${a.numero ?? ""}`
  const fb = `${b.fecha ?? ""}${b.creadoAt ?? ""}${b.numero ?? ""}`
  return fa.localeCompare(fb)
}

/**
 * Recalcula stock y lotes (PPP) desde el libro mayor de movimientos.
 * Función pura sin I/O (ADR-008): la comparten la Server Action (Fase 4) y el migrador.
 * - ENT: recalcula promedio ponderado.
 * - SAL: descuenta cantidad; el PPP no cambia.
 * - TRASPASO BODEGA: saca del origen (sin tocar su PPP) y entra al destino con el costo del origen.
 * Los lotes solo se mueven si el producto maneja atributos y la línea trae lote.
 * Las cantidades nunca bajan de 0 (igual que el origen).
 */
export const recalcularPpp = (
  movimientos: MovimientoPpp[],
  productos: ProductoAtributos[],
): ResultadoPpp => {
  const manejaPorCodigo = new Map(
    productos.map((p) => [p.codigoInterno, p.manejaAtributos]),
  )
  const stockMap = new Map<string, StockPpp>()
  const lotMap = new Map<string, LotePpp>()

  const ensureStock = (cod: string, bod: string) => {
    const k = stockKey(cod, bod)
    const existente = stockMap.get(k)
    if (existente) return existente
    const nuevo: StockPpp = {
      codigoInterno: cod,
      bodegaId: bod,
      cantidad: 0,
      costoPromedio: 0,
    }
    stockMap.set(k, nuevo)
    return nuevo
  }

  const ensureLot = (
    cod: string,
    bod: string,
    lote: string,
    fechaVenc: string | null,
  ) => {
    const k = lotKey(cod, bod, lote)
    const existente = lotMap.get(k)
    if (existente) return existente
    const nuevo: LotePpp = {
      id: `lot|${k}`,
      codigoInterno: cod,
      bodegaId: bod,
      lote,
      fechaVenc,
      cantidad: 0,
      costo: 0,
    }
    lotMap.set(k, nuevo)
    return nuevo
  }

  const vigentes = movimientos
    .filter((m) => !m.anulado)
    .sort(ordenarCronologico)

  for (const m of vigentes) {
    const esTraspaso =
      m.tipoMovimiento === TRASPASO_BODEGA && !!m.bodegaDestinoId
    for (const d of m.lineas) {
      const maneja = manejaPorCodigo.get(d.codigoInterno) ?? false
      const cant = Number(d.cantidad) || 0
      const costo = Number(d.costo) || 0
      const lote = d.lote ?? ""
      const fechaVenc = d.fechaVenc ?? null

      if (esTraspaso && m.bodegaDestinoId) {
        const stOrig = ensureStock(d.codigoInterno, m.bodegaId)
        stOrig.cantidad = Math.max(0, stOrig.cantidad - cant)

        const stDest = ensureStock(d.codigoInterno, m.bodegaDestinoId)
        const valActDest = stDest.cantidad * stDest.costoPromedio
        const newCantDest = stDest.cantidad + cant
        stDest.cantidad = newCantDest
        stDest.costoPromedio =
          newCantDest > 0 ? (valActDest + cant * costo) / newCantDest : costo

        if (maneja && lote) {
          const lotOrig = ensureLot(
            d.codigoInterno,
            m.bodegaId,
            lote,
            fechaVenc,
          )
          lotOrig.cantidad = Math.max(0, lotOrig.cantidad - cant)

          const lotDest = ensureLot(
            d.codigoInterno,
            m.bodegaDestinoId,
            lote,
            fechaVenc,
          )
          const va = lotDest.cantidad * lotDest.costo
          lotDest.cantidad += cant
          lotDest.costo =
            lotDest.cantidad > 0
              ? (va + cant * costo) / lotDest.cantidad
              : costo
          if (fechaVenc && !lotDest.fechaVenc) lotDest.fechaVenc = fechaVenc
        }
      } else if (m.direccion === "ENT") {
        const st = ensureStock(d.codigoInterno, m.bodegaId)
        const valAct = st.cantidad * st.costoPromedio
        const newCant = st.cantidad + cant
        st.cantidad = newCant
        st.costoPromedio =
          newCant > 0 ? (valAct + cant * costo) / newCant : costo

        if (maneja && lote) {
          const lot = ensureLot(d.codigoInterno, m.bodegaId, lote, fechaVenc)
          const va = lot.cantidad * lot.costo
          lot.cantidad += cant
          lot.costo =
            lot.cantidad > 0 ? (va + cant * costo) / lot.cantidad : costo
          if (fechaVenc && !lot.fechaVenc) lot.fechaVenc = fechaVenc
        }
      } else if (m.direccion === "SAL") {
        const st = ensureStock(d.codigoInterno, m.bodegaId)
        st.cantidad = Math.max(0, st.cantidad - cant)

        if (maneja && lote) {
          const lot = ensureLot(d.codigoInterno, m.bodegaId, lote, fechaVenc)
          lot.cantidad = Math.max(0, lot.cantidad - cant)
        }
      }
    }
  }

  return { stock: [...stockMap.values()], lots: [...lotMap.values()] }
}
