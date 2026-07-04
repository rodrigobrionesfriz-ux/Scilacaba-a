import { describe, expect, it } from "vitest"
import {
  narrowEmpresa,
  narrowIndicadoresRoot,
  normalizarSubgrupos,
} from "./config.utils"

describe("narrowEmpresa", () => {
  it("defaults con blob vacío o no-objeto", () => {
    expect(narrowEmpresa(null)).toEqual({
      nombre: "",
      rut: "",
      direccion: "",
      giro: "",
      telefono: "",
      correo: "",
      logo: "",
      recupIEC: false,
    })
  })
  it("extrae los campos presentes", () => {
    const e = narrowEmpresa({ nombre: "La Cabaña", recupIEC: true, extra: 1 })
    expect(e.nombre).toBe("La Cabaña")
    expect(e.recupIEC).toBe(true)
  })
})

describe("narrowIndicadoresRoot", () => {
  it("migra estructura antigua { meses } → histórica", () => {
    const r = narrowIndicadoresRoot({ meses: { MAYO: { usd: 900 } } })
    expect(r.temporadas["2025-2026"]).toEqual({ MAYO: { usd: 900 } })
  })
  it("lee temporadas y descarta valores no numéricos", () => {
    const r = narrowIndicadoresRoot({
      temporadas: { "2025-2026": { MAYO: { usd: "x", utm: 40000 } } },
    })
    expect(r.temporadas["2025-2026"].MAYO).toEqual({ utm: 40000 })
  })
})

describe("normalizarSubgrupos", () => {
  it("trim, mayúsculas, sin vacíos ni duplicados", () => {
    expect(normalizarSubgrupos("a\n  b \nA\n\n")).toEqual(["A", "B"])
  })
})
