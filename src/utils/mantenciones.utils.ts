import {
  MANT_PRODUCTO_DEFAULT,
  MANT_PRODUCTOS,
  OT_PADDING,
  PREFIJO_OT,
  type ProductoServicio,
} from "@/constants/mantenciones.constants"
import type { FacturaOT } from "@/types/mantenciones.types"

// Lógica pura de Servicio y Mantención (regla 8). Sin I/O. Fuente de verdad
// compartida por el form (preview del total en vivo) y las Server Actions (total
// autoritativo + observación del movimiento de factura). Paridad monolito.

const numeroONull = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null

const aTexto = (v: unknown): string => (typeof v === "string" ? v : "")

// Subtotal de una línea = cantidad × valor unitario.
export const calcularSubtotal = (linea: {
  cantidad: number
  valorUnit: number
}): number => linea.cantidad * linea.valorUnit

// Total de la OT = Σ subtotales de sus líneas (index.html: recálculo en vivo).
export const calcularTotalOT = (
  lineas: readonly { cantidad: number; valorUnit: number }[],
): number => lineas.reduce((acc, l) => acc + calcularSubtotal(l), 0)

// Correlativo de OT: "OT-000001" (padStart a OT_PADDING). Paridad monolito.
export const formatNumeroOT = (valor: number): string =>
  `${PREFIJO_OT}-${String(valor).padStart(OT_PADDING, "0")}`

// Producto de servicio genérico de la categoría (fallback Maquinarias, index.html:11765).
export const resolverProductoServicio = (
  categoria: string,
): ProductoServicio => MANT_PRODUCTOS[categoria] ?? MANT_PRODUCTO_DEFAULT

// Descripción de la línea del movimiento de factura (index.html:12162).
export const descripcionMovimientoFactura = (
  categoria: string,
  numeroOT: string,
): string =>
  `${MANT_PRODUCTOS[categoria]?.descripcion ?? "Mantención"} — OT ${numeroOT}`

// Resumen de líneas para la observación (index.html:12145): "tipo: nombre detalle"
// por línea, unidas por " | "; descarta entradas vacías (solo ":").
const resumenLineas = (
  lineas: readonly { tipo: string; productoNombre?: string; detalle?: string }[],
): string =>
  lineas
    .map(
      (l) =>
        `${l.tipo}: ${l.productoNombre ? `${l.productoNombre} ` : ""}${l.detalle ?? ""}`,
    )
    .filter((x) => x.trim() !== ":")
    .join(" | ")

// Observación auto-construida del movimiento de factura (index.html:12157), verbatim:
// "OT N — categoría — activo [— Horómetro: N hrs] [|| resumen] [· obs]".
export const construirObservacionFactura = (datos: {
  numeroOT: string
  categoria: string
  activo: string
  horometro: number | null
  obs: string
  lineas: readonly { tipo: string; productoNombre?: string; detalle?: string }[]
}): string => {
  const resumen = resumenLineas(datos.lineas)
  return (
    `OT ${datos.numeroOT} — ${datos.categoria} — ${datos.activo}` +
    (datos.horometro ? ` — Horómetro: ${datos.horometro} hrs` : "") +
    (resumen ? ` || ${resumen}` : "") +
    (datos.obs ? ` · ${datos.obs}` : "")
  )
}

// Lee y narrowea el blob `factura` jsonb → FacturaOT (regla 11: sin `as`). Una
// factura válida siempre tiene número de documento; si no, se trata como ausente.
export const narrowFactura = (blob: unknown): FacturaOT | null => {
  if (typeof blob !== "object" || blob === null) return null
  const o: Record<string, unknown> = { ...blob }
  const numeroDoc = aTexto(o.numeroDoc)
  if (!numeroDoc) return null
  return {
    tipoDoc: aTexto(o.tipoDoc),
    numeroDoc,
    fecha: aTexto(o.fecha),
    monto: numeroONull(o.monto) ?? 0,
    obs: aTexto(o.obs),
    horometro: numeroONull(o.horometro),
    movimiento: aTexto(o.movimiento),
  }
}
