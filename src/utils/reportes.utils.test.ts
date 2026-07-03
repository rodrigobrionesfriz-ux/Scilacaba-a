import { describe, expect, it } from "vitest"
import type { ResumenPano } from "@/types/invplantas.types"
import {
  fmtMoneda,
  fmtNumero,
  fmtPct,
  totalesResumenInvplantas,
} from "@/utils/reportes.utils"

describe("fmtMoneda", () => {
  it("CLP redondea y agrupa miles", () => {
    expect(fmtMoneda(1234567.8, "CLP")).toBe("$1.234.568")
  })
  it("USD usa dos decimales", () => {
    expect(fmtMoneda(1234.5, "USD")).toBe("USD 1234.50")
  })
})

describe("fmtPct", () => {
  it("null → s/ppto", () => expect(fmtPct(null)).toBe("s/ppto"))
  it("positivo lleva signo +", () => expect(fmtPct(12.34)).toBe("+12.3%"))
  it("negativo conserva el signo", () => expect(fmtPct(-5)).toBe("-5.0%"))
})

describe("fmtNumero", () => {
  it("agrupa miles es-CL", () => expect(fmtNumero(12345)).toBe("12.345"))
})

const resumenFixture: ResumenPano[] = [
  {
    clave: "1|Frutal",
    cuartelId: 1,
    cuartel: "C1",
    variedad: "Frutal",
    nHileras: 2,
    totalPlantas: 10,
    principal: 8,
    poliniz: 2,
    estados: { sano: 6, debil: 2, muerto: 1, replante: 1, falta: 0 },
  },
  {
    clave: "2|Frutal",
    cuartelId: 2,
    cuartel: "C2",
    variedad: "Frutal",
    nHileras: 1,
    totalPlantas: 5,
    principal: 5,
    poliniz: 0,
    estados: { sano: 3, debil: 0, muerto: 0, replante: 1, falta: 1 },
  },
]

describe("totalesResumenInvplantas", () => {
  it("suma total de plantas y desglose por estado", () => {
    const t = totalesResumenInvplantas(resumenFixture)
    expect(t.totalPlantas).toBe(15)
    expect(t.porEstado).toEqual({
      sano: 9,
      debil: 2,
      muerto: 1,
      replante: 2,
      falta: 1,
    })
  })

  it("resumen vacío → todo en cero", () => {
    const t = totalesResumenInvplantas([])
    expect(t.totalPlantas).toBe(0)
    expect(t.porEstado).toEqual({
      sano: 0,
      debil: 0,
      muerto: 0,
      replante: 0,
      falta: 0,
    })
  })
})
