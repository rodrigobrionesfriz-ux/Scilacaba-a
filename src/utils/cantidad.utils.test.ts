import { describe, expect, it } from "vitest"
import { fmtCantidad } from "@/utils/cantidad.utils"

describe("fmtCantidad", () => {
  it("recorta a 2 decimales por defecto (redondeando)", () => {
    expect(fmtCantidad(5.8076534999999865)).toBe("5,81")
    expect(fmtCantidad(52.90765349999999)).toBe("52,91")
  })

  it("no agrega decimales de más (sin ceros a la derecha)", () => {
    expect(fmtCantidad(47.1)).toBe("47,1")
    expect(fmtCantidad(100)).toBe("100")
  })

  it("usa separador de miles es-CL", () => {
    expect(fmtCantidad(1234.5)).toBe("1.234,5")
  })

  it("respeta un tope de decimales distinto", () => {
    expect(fmtCantidad(2.345, 1)).toBe("2,3")
    expect(fmtCantidad(2.345, 0)).toBe("2")
  })

  it("devuelve — para null/undefined/NaN", () => {
    expect(fmtCantidad(null)).toBe("—")
    expect(fmtCantidad(undefined)).toBe("—")
    expect(fmtCantidad(Number.NaN)).toBe("—")
  })

  it("formatea el cero", () => {
    expect(fmtCantidad(0)).toBe("0")
  })
})
