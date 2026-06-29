import { describe, expect, it } from "vitest"
import type { Gps, PasoSecuencia, PlantaCapturada } from "@/types/invplantas.types"
import {
  abrevVariedad,
  desgloseEstados,
  esHileraInvertida,
  generarCodigoBase,
  generarPlantas,
  narrowGps,
  narrowPlanta,
  narrowPlantas,
  recalcularContadores,
  renumerarRecodificar,
  resumenPorPano,
} from "@/utils/invplantas.utils"

const ini: Gps = { lat: 0, lng: 0, precision: 5, hora: null }
const fin: Gps = { lat: 10, lng: 20, precision: 5, hora: null }

const pasos = (...tipos: ("p" | "z")[]): PasoSecuencia[] =>
  tipos.map((t) => ({
    tipo: t === "p" ? "principal" : "poliniz",
    estado: "sano",
  }))

describe("abrevVariedad", () => {
  it("usa el mapa conocido", () => {
    expect(abrevVariedad("Regina")).toBe("REG")
    expect(abrevVariedad("skeena")).toBe("SKE")
  })
  it("cae a 3 letras normalizadas si es desconocida", () => {
    expect(abrevVariedad("Áurea")).toBe("AUR")
  })
})

describe("generarCodigoBase", () => {
  it("compone C<dígitos> + abrev + H<hilera>", () => {
    expect(generarCodigoBase("Cuartel 1", "Regina", "1")).toBe("C1REGH1")
    expect(generarCodigoBase("Cuartel 12", "Lapins", "Hilera 3")).toBe(
      "C12LAPH3",
    )
  })
  it("usa iniciales cuando el cuartel no tiene dígitos", () => {
    expect(generarCodigoBase("Norte", "Bing", "2")).toBe("NORBINH2")
  })
})

describe("recalcularContadores", () => {
  it("cuenta por tipo", () => {
    expect(recalcularContadores(pasos("p", "p", "z"))).toEqual({
      countPrincipal: 2,
      countPoliniz: 1,
    })
  })
})

describe("esHileraInvertida", () => {
  it("invierte las pares", () => {
    expect(esHileraInvertida("2")).toBe(true)
    expect(esHileraInvertida("4")).toBe(true)
    expect(esHileraInvertida("1")).toBe(false)
    expect(esHileraInvertida("3")).toBe(false)
  })
})

describe("generarPlantas", () => {
  it("numera, codifica e interpola GPS en hilera impar (sin invertir)", () => {
    const plantas = generarPlantas({
      secuencia: pasos("p", "p", "p"),
      hilera: "1",
      codigoBase: "C1REGH1",
      gpsInicio: ini,
      gpsFin: fin,
    })
    expect(plantas).toHaveLength(3)
    expect(plantas[0]).toMatchObject({
      seq: 1,
      codigo: "C1REGH1-000001",
      lat: 0,
      lng: 0,
    })
    expect(plantas[1]).toMatchObject({ seq: 2, lat: 5, lng: 10 })
    expect(plantas[2]).toMatchObject({
      seq: 3,
      codigo: "C1REGH1-000003",
      lat: 10,
      lng: 20,
    })
  })

  it("invierte la secuencia en hilera par antes de numerar (zigzag)", () => {
    // Secuencia caminada: principal, principal, poliniz. Hilera par → al numerar
    // la planta #1 es la última caminada (poliniz).
    const plantas = generarPlantas({
      secuencia: pasos("p", "p", "z"),
      hilera: "2",
      codigoBase: "C1REGH2",
      gpsInicio: ini,
      gpsFin: fin,
    })
    expect(plantas.map((p) => p.tipo)).toEqual([
      "poliniz",
      "principal",
      "principal",
    ])
    expect(plantas[0].seq).toBe(1)
    expect(plantas[0].codigo).toBe("C1REGH2-000001")
  })

  it("sin GPS de fin usa solo el inicio", () => {
    const plantas = generarPlantas({
      secuencia: pasos("p", "p"),
      hilera: "1",
      codigoBase: "X",
      gpsInicio: ini,
      gpsFin: null,
    })
    expect(plantas.every((p) => p.lat === 0 && p.lng === 0)).toBe(true)
  })

  it("sin GPS deja lat/lng en null", () => {
    const plantas = generarPlantas({
      secuencia: pasos("p"),
      hilera: "1",
      codigoBase: "X",
      gpsInicio: null,
      gpsFin: null,
    })
    expect(plantas[0]).toMatchObject({ lat: null, lng: null })
  })
})

describe("renumerarRecodificar", () => {
  const base: PlantaCapturada[] = [
    { seq: 5, codigo: "viejo-5", tipo: "principal", estado: "sano", lat: 9, lng: 9 },
    { seq: 9, codigo: "viejo-9", tipo: "poliniz", estado: "debil", lat: 9, lng: 9 },
  ]
  it("renumera, recodifica y reinterpola conservando tipo/estado", () => {
    const out = renumerarRecodificar(base, "C1REGH1", ini, fin)
    expect(out[0]).toMatchObject({
      seq: 1,
      codigo: "C1REGH1-000001",
      tipo: "principal",
      estado: "sano",
      lat: 0,
      lng: 0,
    })
    expect(out[1]).toMatchObject({
      seq: 2,
      codigo: "C1REGH1-000002",
      tipo: "poliniz",
      estado: "debil",
      lat: 10,
      lng: 20,
    })
  })
})

describe("narrowing de blobs jsonb", () => {
  it("narrowGps valida lat/lng numéricos", () => {
    expect(narrowGps({ lat: 1, lng: 2, precision: 3 })).toEqual({
      lat: 1,
      lng: 2,
      precision: 3,
      hora: null,
    })
    expect(narrowGps({ lat: "x", lng: 2 })).toBeNull()
    expect(narrowGps(null)).toBeNull()
  })
  it("narrowPlanta tolera tipo/estado fuera de rango (legacy)", () => {
    expect(narrowPlanta({ tipo: "raro", estado: "??" }, 4)).toMatchObject({
      seq: 5,
      tipo: "principal",
      estado: "sano",
    })
  })
  it("narrowPlantas descarta no-objetos", () => {
    const out = narrowPlantas([
      { seq: 1, codigo: "a", tipo: "poliniz", estado: "muerto", lat: 1, lng: 2 },
      "basura",
      42,
    ])
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ tipo: "poliniz", estado: "muerto" })
  })
  it("narrowPlantas devuelve [] si no es array", () => {
    expect(narrowPlantas("no")).toEqual([])
  })
})

describe("desgloseEstados", () => {
  it("cuenta por estado devolviendo los 5", () => {
    const plantas: PlantaCapturada[] = [
      { seq: 1, codigo: "a", tipo: "principal", estado: "sano", lat: null, lng: null },
      { seq: 2, codigo: "b", tipo: "principal", estado: "sano", lat: null, lng: null },
      { seq: 3, codigo: "c", tipo: "poliniz", estado: "muerto", lat: null, lng: null },
    ]
    expect(desgloseEstados(plantas)).toEqual({
      sano: 2,
      debil: 0,
      muerto: 1,
      replante: 0,
      falta: 0,
    })
  })
})

describe("resumenPorPano", () => {
  it("agrupa por cuartel+variedad sumando hileras, totales y estados", () => {
    const planta = (
      tipo: "principal" | "poliniz",
      estado: PlantaCapturada["estado"],
    ): PlantaCapturada => ({ seq: 1, codigo: "x", tipo, estado, lat: null, lng: null })
    const out = resumenPorPano([
      {
        cuartelId: 1,
        cuartel: "Cuartel 1",
        variedad: "Regina",
        plantas: [planta("principal", "sano"), planta("poliniz", "muerto")],
      },
      {
        cuartelId: 1,
        cuartel: "Cuartel 1",
        variedad: "Regina",
        plantas: [planta("principal", "debil")],
      },
    ])
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      cuartel: "Cuartel 1",
      variedad: "Regina",
      nHileras: 2,
      totalPlantas: 3,
      principal: 2,
      poliniz: 1,
    })
    expect(out[0].estados).toEqual({
      sano: 1,
      debil: 1,
      muerto: 1,
      replante: 0,
      falta: 0,
    })
  })
})
