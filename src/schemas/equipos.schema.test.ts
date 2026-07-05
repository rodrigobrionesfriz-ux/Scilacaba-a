import { describe, expect, it } from "vitest"
import { equipoSchema } from "@/schemas/equipos.schema"

describe("equipoSchema", () => {
  it("acepta un equipo válido", () => {
    const r = equipoSchema.safeParse({ nombre: "Nebulizadora 2000L", capacidad: 2000 })
    expect(r.success).toBe(true)
  })
  it("rechaza nombre vacío", () => {
    expect(equipoSchema.safeParse({ nombre: "", capacidad: 2000 }).success).toBe(false)
  })
  it("rechaza capacidad <= 0", () => {
    expect(equipoSchema.safeParse({ nombre: "X", capacidad: 0 }).success).toBe(false)
  })
})
