import { describe, expect, it } from "vitest"
import {
  eliminarEstimacionSchema,
  guardarEstimacionSchema,
  lineaEstimacionSchema,
  pesosEstadoSchema,
} from "@/schemas/estimaciones.schema"

const pesos = { sano: 100, debil: 60, muerto: 0, replante: 30, falta: 0 }

const linea = {
  panoId: 1,
  panoNombre: "Cuartel 1",
  variedad: "Regina",
  centros: 4,
  frutosCentro: 2,
  kgFruto: 0.011,
  plantas: 100,
  desglose: { sano: 90, debil: 5, muerto: 3, replante: 1, falta: 1 },
  plantasEquiv: 90,
  plantasInvTotal: 100,
  usarEquiv: true,
  pesosEstado: pesos,
}

describe("pesosEstadoSchema", () => {
  it("acepta los 5 estados", () => {
    expect(pesosEstadoSchema.safeParse(pesos).success).toBe(true)
  })
  it("rechaza si falta un estado", () => {
    const sinFalta = {
      sano: pesos.sano,
      debil: pesos.debil,
      muerto: pesos.muerto,
      replante: pesos.replante,
    }
    expect(pesosEstadoSchema.safeParse(sinFalta).success).toBe(false)
  })
  it("rechaza pesos negativos", () => {
    expect(
      pesosEstadoSchema.safeParse({ ...pesos, sano: -1 }).success,
    ).toBe(false)
  })
})

describe("lineaEstimacionSchema", () => {
  it("acepta una línea válida", () => {
    expect(lineaEstimacionSchema.safeParse(linea).success).toBe(true)
  })
  it("acepta plantasEquiv/plantasInvTotal null (sin invplantas)", () => {
    expect(
      lineaEstimacionSchema.safeParse({
        ...linea,
        plantasEquiv: null,
        plantasInvTotal: null,
        usarEquiv: false,
      }).success,
    ).toBe(true)
  })
  it("rechaza plantas negativas", () => {
    expect(
      lineaEstimacionSchema.safeParse({ ...linea, plantas: -5 }).success,
    ).toBe(false)
  })
  it("acepta desglose null (sin invplantas)", () => {
    expect(
      lineaEstimacionSchema.safeParse({ ...linea, desglose: null }).success,
    ).toBe(true)
  })
  it("rechaza conteos de desglose negativos", () => {
    expect(
      lineaEstimacionSchema.safeParse({
        ...linea,
        desglose: { ...linea.desglose, sano: -1 },
      }).success,
    ).toBe(false)
  })
})

describe("guardarEstimacionSchema", () => {
  it("acepta nombre + al menos una línea", () => {
    expect(
      guardarEstimacionSchema.safeParse({ nombre: "Estimación julio", lineas: [linea] })
        .success,
    ).toBe(true)
  })
  it("acepta un id existente (edición)", () => {
    expect(
      guardarEstimacionSchema.safeParse({
        id: "est-1",
        nombre: "Estimación julio",
        lineas: [linea],
      }).success,
    ).toBe(true)
  })
  it("rechaza sin nombre", () => {
    expect(
      guardarEstimacionSchema.safeParse({ nombre: "", lineas: [linea] }).success,
    ).toBe(false)
  })
  it("rechaza sin líneas", () => {
    expect(
      guardarEstimacionSchema.safeParse({ nombre: "x", lineas: [] }).success,
    ).toBe(false)
  })
})

describe("eliminarEstimacionSchema", () => {
  it("valida un id", () => {
    expect(eliminarEstimacionSchema.safeParse({ id: "est-1" }).success).toBe(
      true,
    )
  })
  it("rechaza id vacío", () => {
    expect(eliminarEstimacionSchema.safeParse({ id: "" }).success).toBe(false)
  })
})
