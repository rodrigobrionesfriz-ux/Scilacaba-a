import { describe, expect, it } from "vitest"
import {
  construirComprasUrgentes,
  normalizarNombreProducto,
  type OrdenParaCU,
} from "@/utils/compras-urgentes.utils"

describe("normalizarNombreProducto", () => {
  it("mayúsculas, trim y colapsa espacios", () => {
    expect(normalizarNombreProducto("  aceite  agrícola ")).toBe("ACEITE AGRÍCOLA")
  })
})

describe("construirComprasUrgentes", () => {
  const ordenes: OrdenParaCU[] = [
    {
      id: 1,
      numero: "OA-00001",
      fecha: "2026-01-10",
      productos: [{ nombre: "Aceite", unidad: "L/100L", tProd: 30 }],
    },
  ]
  it("marca faltante cuando el stock no cubre lo requerido", () => {
    const cod = new Map([["ACEITE", "P001"]])
    const stock = new Map([["P001", 10]])
    const r = construirComprasUrgentes(ordenes, cod, stock)
    expect(r).toHaveLength(1)
    expect(r[0].producto).toBe("Aceite")
    expect(r[0].disponible).toBe(10)
    expect(r[0].enBodega).toBe(true)
    expect(r[0].totalFalta).toBe(20)
    expect(r[0].ordenes[0].falta).toBe(20)
  })
  it("sin match en catálogo → no está en bodega, todo es falta", () => {
    const r = construirComprasUrgentes(ordenes, new Map(), new Map())
    expect(r[0].enBodega).toBe(false)
    expect(r[0].disponible).toBe(0)
    expect(r[0].totalFalta).toBe(30)
  })
  it("stock suficiente → no aparece", () => {
    const cod = new Map([["ACEITE", "P001"]])
    const stock = new Map([["P001", 100]])
    expect(construirComprasUrgentes(ordenes, cod, stock)).toHaveLength(0)
  })
})
