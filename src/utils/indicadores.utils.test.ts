import { describe, expect, it } from "vitest"
import {
  anioDeMesEnTemporada,
  construirMeses,
  fusionarTemporada,
  listarTemporadas,
  parseIndicador,
  temporadaActual,
} from "./indicadores.utils"

describe("temporadaActual", () => {
  it("Mayo–Dic → año actual", () => {
    expect(temporadaActual(new Date(2026, 5, 15))).toBe("2026-2027")
  })
  it("Ene–Abr → año-1", () => {
    expect(temporadaActual(new Date(2026, 1, 15))).toBe("2025-2026")
  })
})

describe("parseIndicador", () => {
  it("parsea formato CL", () => {
    expect(parseIndicador("1.234,5")).toBe(1234.5)
    expect(parseIndicador("950")).toBe(950)
  })
  it("vacío / no numérico → null", () => {
    expect(parseIndicador("")).toBeNull()
    expect(parseIndicador(null)).toBeNull()
    expect(parseIndicador("abc")).toBeNull()
  })
})

describe("construirMeses", () => {
  it("omite valores nulos", () => {
    expect(
      construirMeses([{ mes: "MAYO", usd: 900, utm: null, uf: null }]),
    ).toEqual({ MAYO: { usd: 900 } })
  })
})

describe("fusionarTemporada", () => {
  it("preserva las demás temporadas", () => {
    const root = { temporadas: { "2024-2025": { MAYO: { usd: 1 } } } }
    const out = fusionarTemporada(root, "2025-2026", { JUNIO: { usd: 2 } })
    expect(out.temporadas["2024-2025"]).toEqual({ MAYO: { usd: 1 } })
    expect(out.temporadas["2025-2026"]).toEqual({ JUNIO: { usd: 2 } })
  })
})

describe("anioDeMesEnTemporada", () => {
  it("ENE–ABR caen en el año siguiente", () => {
    expect(anioDeMesEnTemporada("MAYO", "2025-2026")).toBe(2025)
    expect(anioDeMesEnTemporada("ENERO", "2025-2026")).toBe(2026)
  })
})

describe("listarTemporadas", () => {
  it("incluye actual, siguiente e histórica, ordenadas", () => {
    const out = listarTemporadas({ temporadas: {} }, new Date(2026, 5, 1))
    expect(out).toContain("2026-2027")
    expect(out).toContain("2027-2028")
    expect(out).toContain("2025-2026")
    expect(out).toEqual([...out].sort())
  })
})
