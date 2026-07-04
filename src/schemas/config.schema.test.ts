import { describe, expect, it } from "vitest"
import { empresaSchema, grupoSchema, tipoSchema } from "./config.schema"

describe("empresaSchema", () => {
  it("exige nombre", () => {
    expect(empresaSchema.safeParse({}).success).toBe(false)
  })
  it("rechaza correo con formato inválido", () => {
    expect(empresaSchema.safeParse({ nombre: "X", correo: "malo" }).success).toBe(
      false,
    )
  })
  it("acepta correo vacío", () => {
    expect(empresaSchema.safeParse({ nombre: "X" }).success).toBe(true)
  })
})

describe("tipoSchema", () => {
  it("normaliza el nombre a mayúsculas", () => {
    const r = tipoSchema.safeParse({ nombre: "fungicida" })
    expect(r.success && r.data.nombre).toBe("FUNGICIDA")
  })
})

describe("grupoSchema", () => {
  it("nombre a mayúsculas y subgrupos por defecto []", () => {
    const r = grupoSchema.safeParse({ nombre: "abc" })
    expect(r.success && r.data.nombre).toBe("ABC")
    expect(r.success && r.data.subgrupos).toEqual([])
  })
})
