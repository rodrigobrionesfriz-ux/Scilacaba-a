import { describe, expect, it } from "vitest"
import {
  editarEstadoSchema,
  insertarPlantaSchema,
  invplantaSchema,
  sincronizarInvplantasSchema,
} from "@/schemas/invplantas.schema"

const hilera = {
  id: "ip-1",
  cuartelId: 17,
  cuartel: "Cuartel 1",
  variedad: "Regina",
  portainjerto: "Colt",
  polinizante: "Bing",
  hilera: "1",
  codigoBase: "C1REGH1",
  usuario: "rbriones",
  secuencia: [
    { tipo: "principal", estado: "sano" },
    { tipo: "poliniz", estado: "muerto" },
  ],
  gpsInicio: { lat: -34.1, lng: -70.9, precision: 5, hora: null },
  gpsFin: { lat: -34.2, lng: -70.8, precision: 5, hora: null },
  fechaInicio: "2026-06-29T09:00:00.000Z",
  fechaFin: "2026-06-29T10:30:00.000Z",
}

describe("invplantaSchema", () => {
  it("acepta una hilera válida", () => {
    expect(invplantaSchema.safeParse(hilera).success).toBe(true)
  })
  it("acepta GPS nulos", () => {
    expect(
      invplantaSchema.safeParse({ ...hilera, gpsInicio: null, gpsFin: null })
        .success,
    ).toBe(true)
  })
  it("rechaza una hilera sin plantas en la secuencia", () => {
    expect(invplantaSchema.safeParse({ ...hilera, secuencia: [] }).success).toBe(
      false,
    )
  })
  it("rechaza un tipo de planta inválido", () => {
    expect(
      invplantaSchema.safeParse({
        ...hilera,
        secuencia: [{ tipo: "raro", estado: "sano" }],
      }).success,
    ).toBe(false)
  })
})

describe("sincronizarInvplantasSchema", () => {
  it("acepta un lote", () => {
    expect(sincronizarInvplantasSchema.safeParse([hilera]).success).toBe(true)
  })
  it("rechaza un lote vacío", () => {
    expect(sincronizarInvplantasSchema.safeParse([]).success).toBe(false)
  })
})

describe("editarEstadoSchema / insertarPlantaSchema", () => {
  it("valida edición de estado", () => {
    expect(
      editarEstadoSchema.safeParse({ id: "ip-1", seq: 3, estado: "replante" })
        .success,
    ).toBe(true)
  })
  it("rechaza estado fuera del enum", () => {
    expect(
      editarEstadoSchema.safeParse({ id: "ip-1", seq: 3, estado: "x" }).success,
    ).toBe(false)
  })
  it("valida inserción con posición y tipo", () => {
    expect(
      insertarPlantaSchema.safeParse({
        id: "ip-1",
        seq: 2,
        posicion: "antes",
        tipo: "poliniz",
        estado: "sano",
      }).success,
    ).toBe(true)
  })
})
