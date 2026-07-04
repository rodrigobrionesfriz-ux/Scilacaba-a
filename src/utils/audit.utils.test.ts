import { describe, expect, it } from "vitest"
import { construirEntradaAudit } from "./audit.utils"

describe("construirEntradaAudit", () => {
  it("usa 'system' cuando no hay usuario", () => {
    expect(construirEntradaAudit(null, "x", "y").usuario).toBe("system")
    expect(construirEntradaAudit(undefined, "x", "y").usuario).toBe("system")
  })

  it("conserva usuario y campos", () => {
    expect(
      construirEntradaAudit("u1", "producto.crear", "Zapallo", "COD1"),
    ).toEqual({
      usuario: "u1",
      accion: "producto.crear",
      detalle: "Zapallo",
      referencia: "COD1",
    })
  })

  it("referencia por defecto vacía", () => {
    expect(construirEntradaAudit("u1", "a", "b").referencia).toBe("")
  })
})
