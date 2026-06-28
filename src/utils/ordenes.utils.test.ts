import { describe, expect, it } from "vitest"
import {
  calcProdQty,
  calcularDistribucion,
  estadoOrden,
  type PanoDistribInput,
  type ProductoInput,
  recalcularProductosReales,
  resolverHas,
  unidadBase,
} from "@/utils/ordenes.utils"

describe("unidadBase", () => {
  it("quita el sufijo /100L y /ha", () => {
    expect(unidadBase("mL/100L")).toBe("mL")
    expect(unidadBase("L/ha")).toBe("L")
    expect(unidadBase("kg/ha")).toBe("kg")
    expect(unidadBase("cc/ha")).toBe("cc")
  })
  it("deja intacto lo que no tiene sufijo", () => {
    expect(unidadBase("L")).toBe("L")
    expect(unidadBase("")).toBe("")
  })
})

describe("calcProdQty", () => {
  it("/100L: (dosis/100) × (mojT × has)", () => {
    // 50 mL/100L, has=5.5, mojT=150 → agua=825 → 0.5×825 = 412.5
    expect(calcProdQty(50, "mL/100L", 5.5, 150)).toBeCloseTo(412.5, 5)
  })
  it("/ha: dosis × has", () => {
    expect(calcProdQty(2, "L/ha", 5.5, 150)).toBeCloseTo(11, 5)
  })
  it("devuelve 0 con dosis o has no positivas", () => {
    expect(calcProdQty(0, "L/ha", 5, 150)).toBe(0)
    expect(calcProdQty(2, "L/ha", 0, 150)).toBe(0)
  })
  it("devuelve 0 si la unidad no es ni /100L ni /ha", () => {
    expect(calcProdQty(2, "L", 5, 150)).toBe(0)
  })
})

describe("resolverHas", () => {
  const pano = { hectareas: 10, hasRiego: 4 }
  it("usa has_riego en Fertirriego", () => {
    expect(resolverHas(pano, "Fertirriego")).toBe(4)
  })
  it("usa hectáreas en el resto de tipos", () => {
    expect(resolverHas(pano, "Foliar")).toBe(10)
  })
  it("trata null como 0", () => {
    expect(resolverHas({ hectareas: null, hasRiego: null }, "Foliar")).toBe(0)
  })
})

const panos: PanoDistribInput[] = [
  { id: "1", nombre: "Sur", variedad: "Bing", anio: "2024", color: "#000", has: 5.5 },
  { id: "2", nombre: "Norte", variedad: "Lapins", anio: "2024", color: "#111", has: 4 },
]

describe("calcularDistribucion", () => {
  it("reparte agua y producto por paño y suma totales", () => {
    const productos: ProductoInput[] = [{ nombre: "Insecticida X", dosis: 50, unidad: "mL/100L" }]
    const r = calcularDistribucion(productos, panos, 100, 1.5)
    expect(r.mojT).toBe(150)
    // agua = mojT × has
    expect(r.distribucion[0].agua).toBeCloseTo(825, 5)
    expect(r.distribucion[1].agua).toBeCloseTo(600, 5)
    // prod = (50/100) × agua
    expect(r.distribucion[0].prod).toBeCloseTo(412.5, 5)
    expect(r.distribucion[1].prod).toBeCloseTo(300, 5)
    expect(r.tHas).toBeCloseTo(9.5, 5)
    expect(r.tAgua).toBeCloseTo(1425, 5)
    expect(r.tProd).toBeCloseTo(712.5, 5)
    expect(r.productos[0].tProd).toBeCloseTo(712.5, 5)
    expect(r.productos[0].unitS).toBe("mL")
  })

  it("maneja mezcla de varios productos (prods por paño + total por producto)", () => {
    const productos: ProductoInput[] = [
      { nombre: "Insecticida X", dosis: 50, unidad: "mL/100L" },
      { nombre: "Fungicida Y", dosis: 2, unidad: "L/ha" },
    ]
    const r = calcularDistribucion(productos, panos, 100, 1.5)
    expect(r.distribucion[0].prods).toHaveLength(2)
    // segundo producto /ha: 2 × has
    expect(r.distribucion[0].prods[1].qty).toBeCloseTo(11, 5)
    expect(r.distribucion[1].prods[1].qty).toBeCloseTo(8, 5)
    expect(r.productos[1].tProd).toBeCloseTo(19, 5)
    // prod (legacy) sigue al primer producto
    expect(r.distribucion[0].prod).toBeCloseTo(412.5, 5)
  })

  it("descarta productos incompletos (sin nombre o dosis ≤ 0)", () => {
    const productos: ProductoInput[] = [
      { nombre: "Bueno", dosis: 2, unidad: "L/ha" },
      { nombre: "", dosis: 3, unidad: "L/ha" },
      { nombre: "Sin dosis", dosis: 0, unidad: "L/ha" },
    ]
    const r = calcularDistribucion(productos, panos, 100, 1)
    expect(r.productos).toHaveLength(1)
    expect(r.productos[0].nombre).toBe("Bueno")
  })
})

describe("recalcularProductosReales", () => {
  const productos = [
    { nombre: "X", dosis: 50, unidad: "mL/100L", unitS: "mL", tProd: 412.5, margin: 412.5 },
  ]
  it("escala por agua real / agua planificada", () => {
    const reales = recalcularProductosReales(productos, 825, 850)
    expect(reales[0].qtyAplicada).toBeCloseTo(412.5 * (850 / 825), 5)
    expect(reales[0].unitS).toBe("mL")
  })
  it("usa factor 1 cuando no hay agua planificada", () => {
    const reales = recalcularProductosReales(productos, 0, 850)
    expect(reales[0].qtyAplicada).toBeCloseTo(412.5, 5)
  })
})

describe("estadoOrden", () => {
  it("Pendiente sin confirmaciones", () => {
    expect(estadoOrden(["1", "2"], [], 0)).toBe("Pendiente")
  })
  it("Pendiente si la orden no tiene paños", () => {
    expect(estadoOrden([], ["1"], 1)).toBe("Pendiente")
  })
  it("Parcial si no cubre todos los paños", () => {
    expect(estadoOrden(["1", "2"], ["1"], 1)).toBe("Parcial")
  })
  it("Completa si todos los paños están cubiertos", () => {
    expect(estadoOrden(["1", "2"], ["2", "1"], 2)).toBe("Completa")
  })
})
