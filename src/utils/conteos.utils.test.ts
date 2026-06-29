import { describe, expect, it } from "vitest"
import {
  formatGps,
  narrowArbol,
  narrowArboles,
  promedioCentros,
  resumenConteo,
} from "@/utils/conteos.utils"

describe("promedioCentros", () => {
  it("promedia los centros florales", () => {
    expect(promedioCentros([{ centros: 10 }, { centros: 20 }])).toBe(15)
  })
  it("devuelve 0 sin árboles", () => {
    expect(promedioCentros([])).toBe(0)
  })
})

describe("narrowArbol", () => {
  const base = {
    n: 1,
    centros: 12,
    tipo: "fijo",
    codigo: "F1",
    lat: -34.1,
    lng: -70.9,
    precision: 5,
    fecha: "2026-06-29T10:00:00.000Z",
  }

  it("acepta un árbol bien formado", () => {
    expect(narrowArbol(base)).toEqual(base)
  })

  it("normaliza GPS ausente o no numérico a null", () => {
    const r = narrowArbol({ ...base, lat: "x", lng: undefined, precision: null })
    expect(r?.lat).toBeNull()
    expect(r?.lng).toBeNull()
    expect(r?.precision).toBeNull()
  })

  it("rechaza tipo inválido", () => {
    expect(narrowArbol({ ...base, tipo: "otro" })).toBeNull()
  })

  it("rechaza objeto sin campos mínimos", () => {
    expect(narrowArbol({ n: 1 })).toBeNull()
    expect(narrowArbol(null)).toBeNull()
    expect(narrowArbol("nope")).toBeNull()
  })

  it("rellena fecha ausente con string vacío", () => {
    const sinFecha: Record<string, unknown> = { ...base }
    delete sinFecha.fecha
    expect(narrowArbol(sinFecha)?.fecha).toBe("")
  })
})

describe("narrowArboles", () => {
  it("descarta entradas malformadas del blob", () => {
    const blob = [
      { n: 1, centros: 5, tipo: "fijo", codigo: "F1" },
      { roto: true },
      { n: 2, centros: 8, tipo: "aleatorio", codigo: "Azar 1" },
    ]
    expect(narrowArboles(blob)).toHaveLength(2)
  })
  it("devuelve [] si no es array", () => {
    expect(narrowArboles(null)).toEqual([])
    expect(narrowArboles({})).toEqual([])
  })
})

describe("resumenConteo", () => {
  it("cuenta total, fijos, aleatorios y promedio", () => {
    const arboles = [
      narrowArbol({ n: 1, centros: 10, tipo: "fijo", codigo: "F1" }),
      narrowArbol({ n: 2, centros: 20, tipo: "fijo", codigo: "F2" }),
      narrowArbol({ n: 3, centros: 30, tipo: "aleatorio", codigo: "Azar 1" }),
    ].flatMap((a) => (a ? [a] : []))
    expect(resumenConteo(arboles)).toEqual({
      total: 3,
      fijos: 2,
      aleatorios: 1,
      promedio: 20,
    })
  })
})

describe("formatGps", () => {
  it("formatea coordenadas a 5 decimales", () => {
    expect(formatGps(-34.123456, -70.987654)).toBe("-34.12346, -70.98765")
  })
  it("devuelve — si falta alguna coordenada", () => {
    expect(formatGps(null, -70.9)).toBe("—")
    expect(formatGps(-34.1, null)).toBe("—")
  })
})
