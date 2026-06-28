// Utilidades puras del Cuaderno · Órdenes de aplicación (regla 8). Espejo de la
// lógica del monolito (index.html): _calcProdQty (L15765), calcDist (L15561),
// cfRecalcProductos (L16661) y cfEstadoOrden (L16356). Sin acceso a datos: la
// Server Action y el form comparten estas funciones como única fuente de verdad.

import type {
  DistribucionPano,
  EstadoOrden,
  ProdDistribuido,
  ProductoOrden,
  ProductoReal,
} from "@/types/ordenes.types"

// Producto tal como lo captura el form (antes de calcular su total).
export type ProductoInput = {
  nombre: string
  dosis: number
  unidad: string
}

// Paño con sus hectáreas ya resueltas (hectareas o has_riego según tipoApp).
export type PanoDistribInput = {
  id: string
  nombre: string
  variedad: string
  anio: string
  color: string
  has: number
}

export type ResultadoDistribucion = {
  distribucion: DistribucionPano[]
  productos: ProductoOrden[]
  mojT: number
  tHas: number
  tAgua: number
  tProd: number
}

// Unidad base: quita el sufijo "/ha" o "/100L". "mL/100L" → "mL", "L/ha" → "L".
export const unidadBase = (unidad: string): string =>
  unidad.replace(/\/(100L|ha)$/i, "").trim()

// ¿La dosis está expresada por cada 100 L de agua (requiere mojamiento)?
const esPor100L = (unidad: string): boolean => unidad.indexOf("/100L") >= 0

// Cantidad de producto para un (paño, dosis, unidad) dado el mojamiento total.
// /100L: (dosis/100) × (mojT × has) · /ha: dosis × has · otro: 0.
export const calcProdQty = (
  dosis: number,
  unidad: string,
  has: number,
  mojT: number,
): number => {
  if (!(dosis > 0) || !(has > 0)) return 0
  if (esPor100L(unidad)) return (dosis / 100) * (mojT * has)
  if (unidad.indexOf("/ha") >= 0) return dosis * has
  return 0
}

// Las hectáreas que aplican según el tipo de OA: Fertirriego usa riego, el resto
// usa la superficie plantada. Espejo de getHas (L15493).
export const resolverHas = (
  pano: { hectareas: number | null; hasRiego: number | null },
  tipoApp: string,
): number =>
  tipoApp === "Fertirriego" ? (pano.hasRiego ?? 0) : (pano.hectareas ?? 0)

// Reparte una OA entre sus paños: agua = mojT × has por paño; cantidad de cada
// producto vía calcProdQty. El primer producto va también en los campos legacy
// (prod/tProd). Espejo de calcDist + emitirOrden.
export const calcularDistribucion = (
  productos: ProductoInput[],
  panos: PanoDistribInput[],
  moj: number,
  vha: number,
): ResultadoDistribucion => {
  const mojT = moj * (vha || 1)
  const completos = productos.filter((p) => p.nombre.trim() && p.dosis > 0)

  let tHas = 0
  let tAgua = 0
  let tProd = 0
  const totalPorProducto = completos.map(() => 0)

  const distribucion: DistribucionPano[] = panos.map((pano) => {
    const has = pano.has
    const agua = mojT * has
    const prods = completos.map((p, i) => {
      const qty = calcProdQty(p.dosis, p.unidad, has, mojT)
      totalPorProducto[i] += qty
      return {
        nombre: p.nombre.trim(),
        qty,
        unitS: unidadBase(p.unidad),
        unidad: p.unidad,
        dosis: p.dosis,
      }
    })
    const prod = prods[0]?.qty ?? 0
    tHas += has
    tAgua += agua
    tProd += prod
    return {
      panoId: pano.id,
      panoNombre: pano.nombre,
      variedad: pano.variedad,
      anio: pano.anio,
      color: pano.color,
      has,
      agua,
      prod,
      prods,
    }
  })

  const productosConTotal: ProductoOrden[] = completos.map((p, i) => ({
    nombre: p.nombre.trim(),
    dosis: p.dosis,
    unidad: p.unidad,
    unitS: unidadBase(p.unidad),
    tProd: totalPorProducto[i],
    margin: totalPorProducto[i],
  }))

  return { distribucion, productos: productosConTotal, mojT, tHas, tAgua, tProd }
}

// Recalcula las cantidades reales aplicadas al confirmar: cada producto se
// escala por la proporción de agua real vs planificada. Espejo de
// cfRecalcProductos. aguaPlan = orden.tAgua; factor 1 si no hay agua planificada.
export const recalcularProductosReales = (
  productos: ProductoOrden[],
  aguaPlan: number,
  aguaReal: number,
): ProductoReal[] => {
  const factor = aguaPlan > 0 ? aguaReal / aguaPlan : 1
  return productos.map((p) => ({
    nombre: p.nombre,
    qtyAplicada: (p.tProd || 0) * factor,
    unitS: p.unitS || unidadBase(p.unidad),
  }))
}

// Estado de cobertura de una OA: Pendiente si no hay confirmaciones o no tiene
// paños; Completa si todos sus paños tienen al menos una confirmación; Parcial
// en otro caso. Espejo de cfEstadoOrden.
export const estadoOrden = (
  panoIds: string[],
  panoIdsConfirmados: string[],
  nConfirmaciones: number,
): EstadoOrden => {
  if (nConfirmaciones <= 0 || panoIds.length === 0) return "Pendiente"
  const cubiertos = new Set(panoIdsConfirmados)
  return panoIds.every((id) => cubiertos.has(id)) ? "Completa" : "Parcial"
}

// ─── Narrowing de blobs jsonb (verbatim del migrador) sin `as` (regla 11) ───

const esRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

const aNumero = (v: unknown): number => (typeof v === "number" ? v : Number(v) || 0)

const aTexto = (v: unknown): string =>
  typeof v === "string" ? v : v == null ? "" : String(v)

const aProductoDistribuido = (v: unknown): ProdDistribuido => {
  const r = esRecord(v) ? v : {}
  return {
    nombre: aTexto(r.nombre),
    qty: aNumero(r.qty),
    unitS: aTexto(r.unitS),
    unidad: aTexto(r.unidad),
    dosis: aNumero(r.dosis),
  }
}

export const aProductosOrden = (blob: unknown): ProductoOrden[] => {
  if (!Array.isArray(blob)) return []
  return blob.map((v) => {
    const r = esRecord(v) ? v : {}
    return {
      nombre: aTexto(r.nombre),
      dosis: aNumero(r.dosis),
      unidad: aTexto(r.unidad),
      unitS: aTexto(r.unitS) || unidadBase(aTexto(r.unidad)),
      tProd: aNumero(r.tProd),
      margin: aNumero(r.margin),
    }
  })
}

export const aDistribucion = (blob: unknown): DistribucionPano[] => {
  if (!Array.isArray(blob)) return []
  return blob.map((v) => {
    const r = esRecord(v) ? v : {}
    const prods = Array.isArray(r.prods) ? r.prods.map(aProductoDistribuido) : []
    return {
      panoId: aTexto(r.panoId),
      panoNombre: aTexto(r.panoNombre),
      variedad: aTexto(r.variedad),
      anio: aTexto(r.anio),
      color: aTexto(r.color),
      has: aNumero(r.has),
      agua: aNumero(r.agua),
      prod: aNumero(r.prod),
      prods,
    }
  })
}

export const aProductosReales = (blob: unknown): ProductoReal[] => {
  if (!Array.isArray(blob)) return []
  return blob.map((v) => {
    const r = esRecord(v) ? v : {}
    return {
      nombre: aTexto(r.nombre),
      qtyAplicada: aNumero(r.qtyAplicada),
      unitS: aTexto(r.unitS),
    }
  })
}
