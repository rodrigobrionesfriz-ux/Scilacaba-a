import { describe, expect, it } from "vitest"
import { movimientoSchema } from "./movimientos.schema"

const base = {
  tipoMovimiento: "COMPRA",
  fecha: "2026-06-27",
  bodegaId: "B1",
  proveedorCodigo: "12345678",
  lineas: [{ codigoInterno: "P000001", cantidad: 5, costo: 100 }],
}

describe("movimientoSchema", () => {
  it("acepta una compra válida y aplica defaults", () => {
    const r = movimientoSchema.safeParse(base)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.observaciones).toBe("")
  })

  it("exige al menos una línea", () => {
    expect(movimientoSchema.safeParse({ ...base, lineas: [] }).success).toBe(
      false,
    )
  })

  it("rechaza una cantidad menor o igual a 0", () => {
    const r = movimientoSchema.safeParse({
      ...base,
      lineas: [{ codigoInterno: "P1", cantidad: 0, costo: 1 }],
    })
    expect(r.success).toBe(false)
  })

  it("COMPRA exige proveedor", () => {
    expect(
      movimientoSchema.safeParse({ ...base, proveedorCodigo: "" }).success,
    ).toBe(false)
  })

  it("VENTA exige cliente", () => {
    const r = movimientoSchema.safeParse({
      ...base,
      tipoMovimiento: "VENTA",
      proveedorCodigo: "",
      clienteCodigo: "",
    })
    expect(r.success).toBe(false)
  })

  it("TRASPASO BODEGA exige destino distinto al origen", () => {
    const traspaso = {
      ...base,
      tipoMovimiento: "TRASPASO BODEGA",
      proveedorCodigo: "",
    }
    expect(movimientoSchema.safeParse(traspaso).success).toBe(false)
    expect(
      movimientoSchema.safeParse({ ...traspaso, bodegaDestinoId: "B1" }).success,
    ).toBe(false)
    expect(
      movimientoSchema.safeParse({ ...traspaso, bodegaDestinoId: "B2" }).success,
    ).toBe(true)
  })

  it("rechaza un tipo de movimiento desconocido", () => {
    const r = movimientoSchema.safeParse({
      ...base,
      tipoMovimiento: "XX",
      proveedorCodigo: "",
    })
    expect(r.success).toBe(false)
  })
})
