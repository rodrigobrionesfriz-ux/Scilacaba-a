import { describe, expect, it } from "vitest"
import {
  arbolSchema,
  conteoSchema,
  sincronizarConteosSchema,
} from "@/schemas/conteos.schema"

const arbol = {
  n: 1,
  centros: 12,
  tipo: "fijo",
  codigo: "F1",
  lat: -34.1,
  lng: -70.9,
  precision: 5,
  fecha: "2026-06-29T10:00:00.000Z",
}

const conteo = {
  id: "cte-1",
  panoId: 17,
  panoNombre: "Cuartel 1",
  variedad: "Regina",
  especie: "Cerezo",
  etapa: "Cuaje",
  fijosCodigos: ["F1", "F2", "F3"],
  usuario: "rbriones",
  arboles: [arbol],
  promedioCentros: 12,
  nArboles: 1,
  fechaInicio: "2026-06-29T09:00:00.000Z",
  fechaFin: "2026-06-29T10:30:00.000Z",
}

describe("arbolSchema", () => {
  it("acepta un árbol válido", () => {
    expect(arbolSchema.safeParse(arbol).success).toBe(true)
  })
  it("acepta GPS nulo", () => {
    expect(
      arbolSchema.safeParse({ ...arbol, lat: null, lng: null, precision: null })
        .success,
    ).toBe(true)
  })
  it("rechaza tipo fuera del enum", () => {
    expect(arbolSchema.safeParse({ ...arbol, tipo: "x" }).success).toBe(false)
  })
})

describe("conteoSchema", () => {
  it("acepta un conteo válido con panoId nulo", () => {
    expect(conteoSchema.safeParse({ ...conteo, panoId: null }).success).toBe(true)
  })
  it("rechaza un conteo sin árboles", () => {
    const r = conteoSchema.safeParse({ ...conteo, arboles: [] })
    expect(r.success).toBe(false)
  })
})

describe("sincronizarConteosSchema", () => {
  it("acepta un lote de conteos", () => {
    expect(sincronizarConteosSchema.safeParse([conteo]).success).toBe(true)
  })
  it("rechaza un lote vacío", () => {
    expect(sincronizarConteosSchema.safeParse([]).success).toBe(false)
  })
})
