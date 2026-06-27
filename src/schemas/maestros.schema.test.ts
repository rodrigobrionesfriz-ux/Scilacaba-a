import { describe, expect, it } from "vitest"
import { centroCostoSchema } from "./centros-costo.schema"
import { entidadComercialSchema } from "./entidad-comercial.schema"
import { productoSchema } from "./productos.schema"

describe("productoSchema", () => {
  it("exige descripción, unidad de medida, tipo y grupo", () => {
    const r = productoSchema.safeParse({ descripcion: "", unidadMedida: "" })
    expect(r.success).toBe(false)
  })

  it("acepta un producto válido y aplica defaults", () => {
    const r = productoSchema.safeParse({
      descripcion: "Cinta",
      unidadMedida: "UN",
      tipoProducto: "INSUMO",
      grupo: "GENERAL",
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.inventariable).toBe(true)
      expect(r.data.stockMinimo).toBe(0)
      expect(r.data.ccDosis).toBeNull()
    }
  })

  it("rechaza una unidad de medida fuera del catálogo", () => {
    const r = productoSchema.safeParse({
      descripcion: "X",
      unidadMedida: "XX",
      tipoProducto: "T",
      grupo: "G",
    })
    expect(r.success).toBe(false)
  })
})

describe("entidadComercialSchema", () => {
  it("acepta código de 6 a 9 dígitos", () => {
    expect(
      entidadComercialSchema.safeParse({ codigo: "12345678", razonSocial: "ACME" })
        .success,
    ).toBe(true)
  })

  it("rechaza código con DV o no numérico", () => {
    expect(
      entidadComercialSchema.safeParse({ codigo: "12345678-9", razonSocial: "A" })
        .success,
    ).toBe(false)
    expect(
      entidadComercialSchema.safeParse({ codigo: "12345", razonSocial: "A" })
        .success,
    ).toBe(false)
  })

  it("rechaza email con formato inválido", () => {
    const r = entidadComercialSchema.safeParse({
      codigo: "123456",
      razonSocial: "A",
      email: "no-es-email",
    })
    expect(r.success).toBe(false)
  })
})

describe("centroCostoSchema", () => {
  it("acepta código con letras, números, guiones y puntos", () => {
    expect(
      centroCostoSchema.safeParse({
        codigo: "ADM-01.A",
        descripcion: "Administración",
        area: "GESTION",
      }).success,
    ).toBe(true)
  })

  it("rechaza código con caracteres inválidos o área vacía", () => {
    expect(
      centroCostoSchema.safeParse({
        codigo: "ADM 01",
        descripcion: "X",
        area: "G",
      }).success,
    ).toBe(false)
    expect(
      centroCostoSchema.safeParse({ codigo: "ADM", descripcion: "X", area: "" })
        .success,
    ).toBe(false)
  })
})
