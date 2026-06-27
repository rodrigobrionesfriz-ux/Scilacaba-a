import { describe, expect, it } from "vitest"
import { formatCodigoProducto } from "./productos.utils"

describe("formatCodigoProducto", () => {
  it("formatea con prefijo P y padding de 6", () => {
    expect(formatCodigoProducto(1)).toBe("P000001")
    expect(formatCodigoProducto(123)).toBe("P000123")
  })

  it("no trunca números con más de 6 dígitos", () => {
    expect(formatCodigoProducto(1234567)).toBe("P1234567")
  })
})
