import { describe, expect, it } from "vitest"
import { rangoPaginas } from "@/utils/paginacion.utils"

describe("rangoPaginas", () => {
  it("devuelve todas las páginas sin elipsis cuando caben (total ≤ 2*alrededor+5)", () => {
    expect(rangoPaginas(1, 7, 1)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(rangoPaginas(4, 7, 1)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it("pone elipsis a la derecha cerca del inicio", () => {
    expect(rangoPaginas(2, 10, 1)).toEqual([1, 2, 3, "ellipsis", 10])
    expect(rangoPaginas(3, 10, 1)).toEqual([1, 2, 3, 4, "ellipsis", 10])
  })

  it("pone elipsis a ambos lados en el medio", () => {
    expect(rangoPaginas(5, 10, 1)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10])
  })

  it("pone elipsis a la izquierda cerca del final", () => {
    expect(rangoPaginas(9, 10, 1)).toEqual([1, "ellipsis", 8, 9, 10])
  })

  it("muestra la página en vez de elipsis cuando el hueco es de una sola", () => {
    // hueco izquierdo = solo la página 2 → se muestra el "2", no elipsis
    expect(rangoPaginas(4, 10, 1)).toEqual([1, 2, 3, 4, 5, "ellipsis", 10])
    // hueco derecho = solo la página 9 → se muestra el "9", no elipsis
    expect(rangoPaginas(7, 10, 1)).toEqual([1, "ellipsis", 6, 7, 8, 9, 10])
  })

  it("siempre incluye la primera y la última página", () => {
    const r = rangoPaginas(50, 100, 1)
    expect(r[0]).toBe(1)
    expect(r[r.length - 1]).toBe(100)
  })

  it("hace clamp de la página actual fuera de rango", () => {
    expect(rangoPaginas(0, 10, 1)).toEqual([1, 2, "ellipsis", 10])
    expect(rangoPaginas(99, 10, 1)).toEqual([1, "ellipsis", 9, 10])
  })

  it("respeta `alrededor` mayor", () => {
    // maxVisible = 2*2+5 = 9, total 20 > 9
    expect(rangoPaginas(10, 20, 2)).toEqual([
      1,
      "ellipsis",
      8,
      9,
      10,
      11,
      12,
      "ellipsis",
      20,
    ])
  })

  it("maneja total 0 y 1", () => {
    expect(rangoPaginas(1, 0, 1)).toEqual([])
    expect(rangoPaginas(1, 1, 1)).toEqual([1])
  })
})
