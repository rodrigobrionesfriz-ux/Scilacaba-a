import { describe, expect, it } from "vitest"
import { criterioIdSchema, criterioSchema } from "./presupuesto.schema"

describe("criterioSchema", () => {
  it("acepta un criterio válido (sin id = creación)", () => {
    const r = criterioSchema.safeParse({
      temporada: "2025-2026",
      tipo: "Poda",
      detalle: "Poda en verde a fines de diciembre",
    })
    expect(r.success).toBe(true)
  })

  it("acepta id opcional (edición) y recorta espacios", () => {
    const r = criterioSchema.safeParse({
      id: "cr_1",
      temporada: " 2025-2026 ",
      tipo: "Riego",
      detalle: " goteo ",
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.id).toBe("cr_1")
      expect(r.data.temporada).toBe("2025-2026")
      expect(r.data.detalle).toBe("goteo")
    }
  })

  it("rechaza campos vacíos", () => {
    expect(
      criterioSchema.safeParse({ temporada: "", tipo: "Poda", detalle: "x" })
        .success,
    ).toBe(false)
    expect(
      criterioSchema.safeParse({ temporada: "2025", tipo: "", detalle: "x" })
        .success,
    ).toBe(false)
    expect(
      criterioSchema.safeParse({ temporada: "2025", tipo: "Poda", detalle: "  " })
        .success,
    ).toBe(false)
  })
})

describe("criterioIdSchema", () => {
  it("exige un id no vacío", () => {
    expect(criterioIdSchema.safeParse({ id: "cr_1" }).success).toBe(true)
    expect(criterioIdSchema.safeParse({ id: "" }).success).toBe(false)
  })
})
