import { ALCANCE_CON_STOCK, ALCANCE_TODOS } from "@/constants/tomas.constants"
import type {
  AjusteLinea,
  AjustesToma,
  Alcance,
  EstadoToma,
  TomaLinea,
  TomaLineaTeorica,
} from "@/types/tomas.types"

const ESTADOS_TOMA: EstadoToma[] = [
  "EN_PROCESO",
  "PENDIENTE_AUTORIZACION",
  "AUTORIZADA",
  "APLICADA",
  "DEVUELTA",
  "RECHAZADA",
]

// Narrowing de estado/alcance crudos (text en DB, verbatim de la migración) a la
// unión literal, sin usar `as` (regla 11). Fallback al estado/alcance base.
export const aEstadoToma = (s: string): EstadoToma =>
  ESTADOS_TOMA.find((e) => e === s) ?? "EN_PROCESO"

export const aAlcance = (s: string): Alcance =>
  s === ALCANCE_TODOS ? "todos" : "conStock"

// ¿La línea tiene diferencia entre físico y teórico? Solo cuenta si se ingresó el
// físico (las líneas sin contar no generan ajuste hasta que se asumen en 0 al cerrar).
export const lineaTieneDiferencia = (l: TomaLinea): boolean =>
  l.fisicoIngresado && l.fisico !== null && l.fisico !== l.teorico

// Convierte una línea con diferencia en una línea de ajuste (movimiento TIE/TIS).
// cantidad siempre positiva; el costo usa el costoTeorico congelado al iniciar.
const aAjuste = (l: TomaLinea, cantidad: number): AjusteLinea => ({
  codigoInterno: l.codigoInterno,
  descripcion: l.descripcion,
  unidadMedida: l.unidadMedida,
  cantidad,
  costo: l.costoTeorico,
  lote: l.lote ?? "",
  fechaVenc: l.fechaVenc ?? "",
  loteId: l.loteId ?? "",
})

// Separa las diferencias en sobrantes (físico > teórico → TIE) y faltantes
// (físico < teórico → TIS). Espejo de _aplicarAjustesToma del monolito.
export const calcularAjustes = (lineas: TomaLinea[]): AjustesToma => {
  const sobrantes: AjusteLinea[] = []
  const faltantes: AjusteLinea[] = []
  for (const l of lineas) {
    if (!lineaTieneDiferencia(l) || l.fisico === null) continue
    if (l.fisico > l.teorico) sobrantes.push(aAjuste(l, l.fisico - l.teorico))
    else faltantes.push(aAjuste(l, l.teorico - l.fisico))
  }
  return { sobrantes, faltantes }
}

// Datos mínimos por producto para armar las líneas teóricas de una toma.
export type ProductoToma = {
  codigoInterno: string
  descripcion: string
  unidadMedida: string
  manejaAtributos: boolean
}

export type StockToma = { cantidad: number; costoPromedio: number }

export type LoteToma = {
  id: string
  lote: string
  fechaVenc: string | null
  cantidad: number
  costo: number
}

// Construye la lista de líneas teóricas (snapshot del stock) al iniciar una toma.
// Espejo de iniciarToma del monolito: una línea por lote con saldo si el producto
// maneja atributos; si no, una línea con el stock del par (cod, bodega). El alcance
// `conStock` omite lo que no tiene existencias. Ordenada por descripción.
export const construirLineasTeoricas = (
  productos: ProductoToma[],
  stockPorCodigo: Map<string, StockToma>,
  lotesPorCodigo: Map<string, LoteToma[]>,
  alcance: Alcance,
): TomaLineaTeorica[] => {
  const lineas: TomaLineaTeorica[] = []
  for (const p of productos) {
    const st = stockPorCodigo.get(p.codigoInterno)
    const tieneStock = !!st && st.cantidad > 0
    if (alcance === ALCANCE_CON_STOCK && !tieneStock && !p.manejaAtributos)
      continue

    if (p.manejaAtributos) {
      const lotes = (lotesPorCodigo.get(p.codigoInterno) ?? []).filter(
        (l) => l.cantidad > 0,
      )
      if (lotes.length === 0 && alcance !== ALCANCE_CON_STOCK) {
        lineas.push({
          codigoInterno: p.codigoInterno,
          descripcion: p.descripcion,
          unidadMedida: p.unidadMedida,
          manejaAtributos: true,
          loteId: null,
          lote: null,
          fechaVenc: null,
          teorico: 0,
          costoTeorico: 0,
        })
        continue
      }
      for (const l of lotes) {
        lineas.push({
          codigoInterno: p.codigoInterno,
          descripcion: p.descripcion,
          unidadMedida: p.unidadMedida,
          manejaAtributos: true,
          loteId: l.id,
          lote: l.lote,
          fechaVenc: l.fechaVenc,
          teorico: l.cantidad,
          costoTeorico: l.costo,
        })
      }
      continue
    }

    if (alcance === ALCANCE_CON_STOCK && !tieneStock) continue
    lineas.push({
      codigoInterno: p.codigoInterno,
      descripcion: p.descripcion,
      unidadMedida: p.unidadMedida,
      manejaAtributos: false,
      loteId: null,
      lote: null,
      fechaVenc: null,
      teorico: st ? st.cantidad : 0,
      costoTeorico: st ? st.costoPromedio : 0,
    })
  }
  return lineas.sort((a, b) => a.descripcion.localeCompare(b.descripcion))
}
