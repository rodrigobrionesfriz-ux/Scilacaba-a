import { describe, expect, it } from "vitest"
import { aportesSchema } from "./aportes.schema"
import { configFertSchema } from "./fertirriego-config.schema"
import { oafSchema } from "./oaf.schema"
import { sectorSchema } from "./sectores.schema"

describe("sectorSchema", () => {
  it("exige nombre y deja numéricos opcionales en null", () => {
    expect(sectorSchema.safeParse({ nombre: "" }).success).toBe(false)
    const r = sectorSchema.safeParse({ nombre: "EQ-1 Sector A" })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.ha).toBeNull()
      expect(r.data.plantas).toBeNull()
      expect(r.data.equipo).toBe("")
    }
  })

  it("coacciona ha desde string y rechaza negativos", () => {
    const ok = sectorSchema.safeParse({ nombre: "S", ha: "1.5" })
    expect(ok.success).toBe(true)
    if (ok.success) expect(ok.data.ha).toBe(1.5)
    expect(sectorSchema.safeParse({ nombre: "S", ha: "-1" }).success).toBe(false)
  })
})

describe("oafSchema", () => {
  const base = {
    fecha: "2026-06-29",
    sectores: ["s1"],
    lineas: [{ prod: "Urea", dosis: 5, unidad: "kg" }],
  }

  it("acepta una OAF mínima válida con defaults vacíos", () => {
    const r = oafSchema.safeParse(base)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.forma).toBe("")
      expect(r.data.lineas[0].obs).toBe("")
    }
  })

  it("rechaza sin sectores o sin líneas", () => {
    expect(oafSchema.safeParse({ ...base, sectores: [] }).success).toBe(false)
    expect(oafSchema.safeParse({ ...base, lineas: [] }).success).toBe(false)
  })

  it("rechaza línea con dosis ≤ 0 o sin producto/unidad", () => {
    expect(
      oafSchema.safeParse({
        ...base,
        lineas: [{ prod: "Urea", dosis: 0, unidad: "kg" }],
      }).success,
    ).toBe(false)
    expect(
      oafSchema.safeParse({
        ...base,
        lineas: [{ prod: "", dosis: 1, unidad: "kg" }],
      }).success,
    ).toBe(false)
    expect(
      oafSchema.safeParse({
        ...base,
        lineas: [{ prod: "Urea", dosis: 1, unidad: "" }],
      }).success,
    ).toBe(false)
  })

  it("coacciona la dosis desde string", () => {
    const r = oafSchema.safeParse({
      ...base,
      lineas: [{ prod: "Urea", dosis: "2.5", unidad: "kg" }],
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.lineas[0].dosis).toBe(2.5)
  })
})

describe("aportesSchema", () => {
  it("exige nombre y coacciona % de nutrientes", () => {
    expect(aportesSchema.safeParse({ nombre: "" }).success).toBe(false)
    const r = aportesSchema.safeParse({
      nombre: "Urea",
      aportes: { N: "46" },
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.aportes.N).toBe(46)
  })

  it("rechaza nutriente fuera del catálogo", () => {
    expect(
      aportesSchema.safeParse({ nombre: "X", aportes: { Xx: 1 } }).success,
    ).toBe(false)
  })
})

describe("configFertSchema", () => {
  it("aplica defaults vacíos y normaliza listas", () => {
    const r = configFertSchema.safeParse({ formas: ["POR GOTEO"] })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.formas).toEqual(["POR GOTEO"])
      expect(r.data.estados).toEqual([])
      expect(r.data.rangos).toEqual([])
    }
  })

  it("valida rangos con especie obligatoria", () => {
    expect(
      configFertSchema.safeParse({ rangos: [{ especie: "", desde: 1, hasta: 9 }] })
        .success,
    ).toBe(false)
  })
})
