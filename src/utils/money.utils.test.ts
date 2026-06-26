import { describe, it, expect } from "vitest"
import { formatCLP } from "./money.utils"

describe("formatCLP", () => {
  it("formatea pesos chilenos sin decimales", () => {
    expect(formatCLP(1000)).toBe("$1.000")
    expect(formatCLP(2500000)).toBe("$2.500.000")
    expect(formatCLP(0)).toBe("$0")
  })
})
