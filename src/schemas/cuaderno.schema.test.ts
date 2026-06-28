import { describe, expect, it } from "vitest"
import { aplicacionSchema } from "./aplicaciones.schema"
import { confirmacionSchema } from "./confirmaciones.schema"
import { ordenSchema } from "./ordenes.schema"
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

describe("ordenSchema", () => {
  const base = {
    fecha: "2026-06-28",
    tipoApp: "Foliar",
    fenologico: "Plena flor",
    panoIds: ["1", "2"],
    productos: [{ nombre: "Cobre", dosis: "2", unidad: "L/ha" }],
  }

  it("acepta una OA válida, coacciona dosis/moj/vha con defaults", () => {
    const r = ordenSchema.safeParse(base)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.productos[0].dosis).toBe(2)
      expect(r.data.vha).toBe(1)
      expect(r.data.moj).toBe(0)
      expect(r.data.objetivos).toEqual([])
    }
  })

  it("rechaza sin paños o sin productos", () => {
    expect(ordenSchema.safeParse({ ...base, panoIds: [] }).success).toBe(false)
    expect(ordenSchema.safeParse({ ...base, productos: [] }).success).toBe(false)
  })

  it("rechaza tipo/fenológico/unidad fuera del catálogo y dosis ≤ 0", () => {
    expect(ordenSchema.safeParse({ ...base, tipoApp: "X" }).success).toBe(false)
    expect(ordenSchema.safeParse({ ...base, fenologico: "X" }).success).toBe(false)
    expect(
      ordenSchema.safeParse({
        ...base,
        productos: [{ nombre: "Cobre", dosis: "0", unidad: "L/ha" }],
      }).success,
    ).toBe(false)
  })
})

describe("confirmacionSchema", () => {
  const base = {
    ordenId: "123",
    fechaApp: "2026-06-28",
    operador: "Juan",
    panoIds: ["1"],
    aguaReal: "850",
  }

  it("acepta una confirmación válida y coacciona numéricos", () => {
    const r = confirmacionSchema.safeParse(base)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.ordenId).toBe(123)
      expect(r.data.aguaReal).toBe(850)
      expect(r.data.turno).toBe("")
    }
  })

  it("exige fecha, operador y al menos un paño", () => {
    expect(confirmacionSchema.safeParse({ ...base, fechaApp: "" }).success).toBe(
      false,
    )
    expect(confirmacionSchema.safeParse({ ...base, operador: "" }).success).toBe(
      false,
    )
    expect(confirmacionSchema.safeParse({ ...base, panoIds: [] }).success).toBe(
      false,
    )
  })
})
