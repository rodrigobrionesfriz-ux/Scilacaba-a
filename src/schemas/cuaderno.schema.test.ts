import { describe, expect, it } from "vitest"
import { aplicacionSchema } from "./aplicaciones.schema"
import { panoSchema } from "./panos.schema"
import { productoCuadernoSchema } from "./productos-cuaderno.schema"

describe("panoSchema", () => {
  it("exige nombre", () => {
    expect(panoSchema.safeParse({ nombre: "" }).success).toBe(false)
  })

  it("acepta un paño mínimo y deja los numéricos en null", () => {
    const r = panoSchema.safeParse({ nombre: "A-1" })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.hectareas).toBeNull()
      expect(r.data.plantas).toBeNull()
      expect(r.data.variedad).toBe("")
    }
  })

  it("coacciona numéricos desde string y rechaza negativos", () => {
    const ok = panoSchema.safeParse({ nombre: "A-1", hectareas: "2.5" })
    expect(ok.success).toBe(true)
    if (ok.success) expect(ok.data.hectareas).toBe(2.5)
    expect(panoSchema.safeParse({ nombre: "A-1", hectareas: "-1" }).success).toBe(
      false,
    )
  })

  it("rechaza plantas no entero", () => {
    expect(panoSchema.safeParse({ nombre: "A-1", plantas: "1.5" }).success).toBe(
      false,
    )
  })
})

describe("productoCuadernoSchema", () => {
  it("exige nombre y aplica defaults vacíos", () => {
    expect(productoCuadernoSchema.safeParse({ nombre: "" }).success).toBe(false)
    const r = productoCuadernoSchema.safeParse({ nombre: "Cobre" })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.tipo).toBe("")
      expect(r.data.objetivo).toBe("")
    }
  })
})

describe("aplicacionSchema", () => {
  const base = {
    fecha: "2026-06-28",
    panoId: "123",
    tipo: "Fungicida",
    producto: "Cobre",
    metodo: "Drench",
  }

  it("acepta una aplicación válida, coacciona panoId y default de unidad", () => {
    const r = aplicacionSchema.safeParse(base)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.panoId).toBe(123)
      expect(r.data.unidad).toBe("L/ha")
    }
  })

  it("rechaza paño no seleccionado", () => {
    expect(aplicacionSchema.safeParse({ ...base, panoId: "" }).success).toBe(false)
  })

  it("rechaza tipo y método fuera del catálogo", () => {
    expect(aplicacionSchema.safeParse({ ...base, tipo: "X" }).success).toBe(false)
    expect(aplicacionSchema.safeParse({ ...base, metodo: "X" }).success).toBe(
      false,
    )
  })

  it("exige fecha y producto", () => {
    expect(aplicacionSchema.safeParse({ ...base, fecha: "" }).success).toBe(false)
    expect(aplicacionSchema.safeParse({ ...base, producto: "" }).success).toBe(
      false,
    )
  })
})
