import { describe, expect, it } from "vitest"
import {
  esStockBajo,
  labelProductoMovimiento,
  loteVencePronto,
} from "@/utils/dashboard.utils"

describe("esStockBajo", () => {
  it("bajo cuando total <= mínimo y hay mínimo e inventariable", () => {
    expect(esStockBajo(true, 10, 10)).toBe(true)
    expect(esStockBajo(true, 10, 3)).toBe(true)
  })
  it("no aplica sin mínimo, no inventariable, o con stock suficiente", () => {
    expect(esStockBajo(true, 0, 0)).toBe(false)
    expect(esStockBajo(false, 10, 0)).toBe(false)
    expect(esStockBajo(true, 10, 11)).toBe(false)
  })
})

describe("labelProductoMovimiento", () => {
  it("sin líneas → guión", () => {
    expect(labelProductoMovimiento("", 0)).toBe("—")
  })
  it("una línea → nombre", () => {
    expect(labelProductoMovimiento("Aceite", 1)).toBe("Aceite")
  })
  it("varias → nombre +N", () => {
    expect(labelProductoMovimiento("Aceite", 3)).toBe("Aceite +2")
  })
})

describe("loteVencePronto", () => {
  const hoy = Date.UTC(2026, 0, 1)
  it("vence dentro de la ventana", () => {
    expect(loteVencePronto("2026-01-20", hoy, 30)).toBe(true)
  })
  it("fuera de ventana o sin fecha", () => {
    expect(loteVencePronto("2026-03-01", hoy, 30)).toBe(false)
    expect(loteVencePronto(null, hoy, 30)).toBe(false)
  })
})
