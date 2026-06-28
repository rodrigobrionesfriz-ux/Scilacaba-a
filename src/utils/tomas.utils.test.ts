import { describe, expect, it } from "vitest"
import type { TomaLinea } from "@/types/tomas.types"
import {
  calcularAjustes,
  construirLineasTeoricas,
  lineaTieneDiferencia,
  type LoteToma,
  type ProductoToma,
  type StockToma,
} from "./tomas.utils"

const linea = (over: Partial<TomaLinea>): TomaLinea => ({
  id: 1,
  codigoInterno: "P1",
  descripcion: "Producto 1",
  unidadMedida: "UN",
  manejaAtributos: false,
  loteId: null,
  lote: null,
  fechaVenc: null,
  teorico: 10,
  costoTeorico: 100,
  fisico: null,
  fisicoIngresado: false,
  asumidoCero: false,
  ...over,
})

describe("lineaTieneDiferencia", () => {
  it("es false si no se ingresó el físico", () => {
    expect(lineaTieneDiferencia(linea({ fisico: null }))).toBe(false)
  })
  it("es false si físico === teórico", () => {
    expect(
      lineaTieneDiferencia(linea({ fisico: 10, fisicoIngresado: true })),
    ).toBe(false)
  })
  it("es true si físico ≠ teórico y se ingresó", () => {
    expect(
      lineaTieneDiferencia(linea({ fisico: 8, fisicoIngresado: true })),
    ).toBe(true)
  })
})

describe("calcularAjustes", () => {
  it("clasifica sobrantes (TIE) y faltantes (TIS) con cantidad positiva", () => {
    const { sobrantes, faltantes } = calcularAjustes([
      linea({ id: 1, fisico: 12, fisicoIngresado: true }), // +2 sobrante
      linea({ id: 2, codigoInterno: "P2", fisico: 7, fisicoIngresado: true }), // -3 faltante
    ])
    expect(sobrantes).toHaveLength(1)
    expect(sobrantes[0]).toMatchObject({ codigoInterno: "P1", cantidad: 2 })
    expect(faltantes).toHaveLength(1)
    expect(faltantes[0]).toMatchObject({ codigoInterno: "P2", cantidad: 3 })
  })

  it("usa el costoTeorico congelado como costo del ajuste", () => {
    const { sobrantes } = calcularAjustes([
      linea({ fisico: 11, fisicoIngresado: true, costoTeorico: 250 }),
    ])
    expect(sobrantes[0].costo).toBe(250)
  })

  it("ignora líneas sin diferencia o sin ingresar", () => {
    const { sobrantes, faltantes } = calcularAjustes([
      linea({ fisico: 10, fisicoIngresado: true }), // sin diferencia
      linea({ fisico: null, fisicoIngresado: false }), // sin contar
    ])
    expect(sobrantes).toHaveLength(0)
    expect(faltantes).toHaveLength(0)
  })

  it("una línea asumida en cero (físico=0) genera faltante por todo el teórico", () => {
    const { faltantes } = calcularAjustes([
      linea({ fisico: 0, fisicoIngresado: true, asumidoCero: true }),
    ])
    expect(faltantes[0].cantidad).toBe(10)
  })
})

describe("construirLineasTeoricas", () => {
  const prod = (over: Partial<ProductoToma>): ProductoToma => ({
    codigoInterno: "P1",
    descripcion: "Producto 1",
    unidadMedida: "UN",
    manejaAtributos: false,
    ...over,
  })
  const stock = (m: Record<string, StockToma>) => new Map(Object.entries(m))
  const lotes = (m: Record<string, LoteToma[]>) => new Map(Object.entries(m))

  it("alcance conStock omite productos sin existencias", () => {
    const lineas = construirLineasTeoricas(
      [prod({ codigoInterno: "SIN" }), prod({ codigoInterno: "CON" })],
      stock({ CON: { cantidad: 5, costoPromedio: 100 } }),
      lotes({}),
      "conStock",
    )
    expect(lineas).toHaveLength(1)
    expect(lineas[0].codigoInterno).toBe("CON")
    expect(lineas[0].teorico).toBe(5)
  })

  it("alcance todos incluye productos sin stock con teórico 0", () => {
    const lineas = construirLineasTeoricas(
      [prod({ codigoInterno: "SIN" })],
      stock({}),
      lotes({}),
      "todos",
    )
    expect(lineas).toHaveLength(1)
    expect(lineas[0].teorico).toBe(0)
  })

  it("producto con atributos genera una línea por lote con saldo", () => {
    const lineas = construirLineasTeoricas(
      [prod({ codigoInterno: "LOT", manejaAtributos: true })],
      stock({ LOT: { cantidad: 8, costoPromedio: 50 } }),
      lotes({
        LOT: [
          { id: "l1", lote: "A", fechaVenc: null, cantidad: 5, costo: 50 },
          { id: "l2", lote: "B", fechaVenc: null, cantidad: 3, costo: 60 },
          { id: "l3", lote: "C", fechaVenc: null, cantidad: 0, costo: 70 },
        ],
      }),
      "todos",
    )
    expect(lineas).toHaveLength(2)
    expect(lineas.map((l) => l.lote)).toEqual(["A", "B"])
    expect(lineas[0].costoTeorico).toBe(50)
  })

  it("ordena por descripción", () => {
    const lineas = construirLineasTeoricas(
      [
        prod({ codigoInterno: "Z", descripcion: "Zeta" }),
        prod({ codigoInterno: "A", descripcion: "Alfa" }),
      ],
      stock({ Z: { cantidad: 1, costoPromedio: 1 }, A: { cantidad: 1, costoPromedio: 1 } }),
      lotes({}),
      "todos",
    )
    expect(lineas.map((l) => l.descripcion)).toEqual(["Alfa", "Zeta"])
  })
})
