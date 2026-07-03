import { describe, expect, it } from "vitest"
import {
  calcularSubtotal,
  calcularTotalOT,
  construirObservacionFactura,
  descripcionMovimientoFactura,
  formatNumeroOT,
  narrowFactura,
  resolverProductoServicio,
} from "./mantenciones.utils"

describe("calcularSubtotal / calcularTotalOT", () => {
  it("subtotal = cantidad × valorUnit", () => {
    expect(calcularSubtotal({ cantidad: 3, valorUnit: 1500 })).toBe(4500)
    expect(calcularSubtotal({ cantidad: 0, valorUnit: 1500 })).toBe(0)
  })

  it("total = suma de subtotales", () => {
    expect(
      calcularTotalOT([
        { cantidad: 2, valorUnit: 1000 },
        { cantidad: 1, valorUnit: 500 },
      ]),
    ).toBe(2500)
    expect(calcularTotalOT([])).toBe(0)
  })
})

describe("formatNumeroOT", () => {
  it("formatea con prefijo OT y padding de 6", () => {
    expect(formatNumeroOT(1)).toBe("OT-000001")
    expect(formatNumeroOT(123)).toBe("OT-000123")
  })

  it("no trunca números con más de 6 dígitos", () => {
    expect(formatNumeroOT(1234567)).toBe("OT-1234567")
  })
})

describe("resolverProductoServicio", () => {
  it("resuelve el producto de la categoría", () => {
    expect(resolverProductoServicio("Riego").codigo).toBe("SERV-RIE")
    expect(resolverProductoServicio("Servicios").codigo).toBe("SERV-SER")
  })

  it("cae en Maquinarias si la categoría no existe", () => {
    expect(resolverProductoServicio("Desconocida").codigo).toBe("SERV-MAQ")
  })
})

describe("descripcionMovimientoFactura", () => {
  it("usa la descripción de la categoría + N° OT", () => {
    expect(descripcionMovimientoFactura("Riego", "OT-000005")).toBe(
      "Mantención Riego — OT OT-000005",
    )
  })

  it("cae en 'Mantención' si la categoría no está mapeada", () => {
    expect(descripcionMovimientoFactura("Otra", "OT-000005")).toBe(
      "Mantención — OT OT-000005",
    )
  })
})

describe("construirObservacionFactura", () => {
  it("arma la observación completa (verbatim monolito)", () => {
    const obs = construirObservacionFactura({
      numeroOT: "OT-000010",
      categoria: "Maquinarias",
      activo: "Tractor JD 5075",
      horometro: 1200,
      obs: "revisión anual",
      lineas: [
        { tipo: "Repuestos", productoNombre: "Filtro", detalle: "aceite" },
        { tipo: "Mano de obra", detalle: "" },
      ],
    })
    expect(obs).toBe(
      "OT OT-000010 — Maquinarias — Tractor JD 5075 — Horómetro: 1200 hrs || Repuestos: Filtro aceite | Mano de obra:  · revisión anual",
    )
  })

  it("omite horómetro/resumen/obs cuando están vacíos", () => {
    const obs = construirObservacionFactura({
      numeroOT: "OT-000011",
      categoria: "Riego",
      activo: "",
      horometro: null,
      obs: "",
      lineas: [],
    })
    expect(obs).toBe("OT OT-000011 — Riego — ")
  })
})

describe("narrowFactura", () => {
  it("narrowea un blob de factura válido", () => {
    const f = narrowFactura({
      tipoDoc: "Factura",
      numeroDoc: "12345",
      fecha: "2026-07-01",
      monto: 90000,
      obs: "ok",
      horometro: 500,
      movimiento: "SERV-3",
    })
    expect(f).toEqual({
      tipoDoc: "Factura",
      numeroDoc: "12345",
      fecha: "2026-07-01",
      monto: 90000,
      obs: "ok",
      horometro: 500,
      movimiento: "SERV-3",
    })
  })

  it("devuelve null para blobs nulos, no-objeto o sin numeroDoc", () => {
    expect(narrowFactura(null)).toBeNull()
    expect(narrowFactura("x")).toBeNull()
    expect(narrowFactura({ tipoDoc: "Factura" })).toBeNull()
  })

  it("tolera campos ausentes con defaults", () => {
    const f = narrowFactura({ numeroDoc: "9" })
    expect(f).toEqual({
      tipoDoc: "",
      numeroDoc: "9",
      fecha: "",
      monto: 0,
      obs: "",
      horometro: null,
      movimiento: "",
    })
  })
})
