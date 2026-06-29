import { describe, expect, it } from "vitest"
import {
  aConfigFert,
  aLineas,
  buscarAporteBase,
  calcularAportes,
  dosisAKg,
  frNorm,
  haTotalSectores,
} from "@/utils/fertirriego.utils"
import type { Aportes, LineaOaf } from "@/types/fertirriego.types"

describe("dosisAKg", () => {
  it("convierte gramos y cc/mL a kg dividiendo por 1000", () => {
    expect(dosisAKg(500, "GRS.")).toBe(0.5)
    expect(dosisAKg(250, "C.C")).toBe(0.25)
    expect(dosisAKg(1000, "mL")).toBe(1)
  })
  it("deja kg y litros tal cual (densidad ~1)", () => {
    expect(dosisAKg(3, "kg")).toBe(3)
    expect(dosisAKg(2, "L")).toBe(2)
  })
  it("asume kg por defecto en unidad desconocida", () => {
    expect(dosisAKg(4, "saco")).toBe(4)
  })
})

describe("haTotalSectores", () => {
  it("suma las hectáreas tratando null como 0", () => {
    expect(haTotalSectores([{ ha: 1.5 }, { ha: null }, { ha: 2 }])).toBe(3.5)
  })
})

describe("calcularAportes", () => {
  const aportes = new Map<string, Aportes>([
    ["Urea", { N: 46 }],
    ["MAP", { N: 12, P: 26 }],
  ])
  it("calcula kg por nutriente = dosisAKg × ha × %/100", () => {
    const lineas: LineaOaf[] = [{ prod: "Urea", dosis: 1000, unidad: "GRS.", obs: "" }]
    // 1000 g → 1 kg/ha × 10 ha = 10 kg producto; N 46% → 4.6 kg
    const r = calcularAportes(lineas, aportes, 10)
    expect(r.length).toBe(1)
    expect(r[0].nutriente).toBe("N")
    expect(r[0].kg).toBeCloseTo(4.6, 6)
  })
  it("acumula varios productos y omite nutrientes en 0", () => {
    const lineas: LineaOaf[] = [
      { prod: "Urea", dosis: 1, unidad: "kg", obs: "" },
      { prod: "MAP", dosis: 1, unidad: "kg", obs: "" },
    ]
    const r = calcularAportes(lineas, aportes, 1)
    const porNu = Object.fromEntries(r.map((a) => [a.nutriente, a.kg]))
    expect(porNu.N).toBeCloseTo(0.46 + 0.12, 6)
    expect(porNu.P).toBeCloseTo(0.26, 6)
    expect(porNu.K).toBeUndefined()
  })
  it("ignora líneas sin composición conocida", () => {
    const lineas: LineaOaf[] = [{ prod: "Desconocido", dosis: 1, unidad: "kg", obs: "" }]
    expect(calcularAportes(lineas, aportes, 1)).toEqual([])
  })
})

describe("frNorm", () => {
  it("baja a minúsculas y quita tildes", () => {
    expect(frNorm("Ácido Fosfórico")).toBe("acido fosforico")
  })
})

describe("buscarAporteBase", () => {
  it("encuentra por nombre simple", () => {
    expect(buscarAporteBase("Urea granulada")?.ap).toEqual({ N: 46 })
  })
  it("prefiere la coincidencia con más patrones (la más específica)", () => {
    // "sulfato de potasio y magnesio" cumple 3 patrones vs 2 de "sulfato de potasio"
    const r = buscarAporteBase("Sulfato de potasio y magnesio premium")
    expect(r?.nombreBase).toBe("Sulfato de potasio y magnesio")
  })
  it("devuelve null si no hay coincidencia", () => {
    expect(buscarAporteBase("producto raro")).toBeNull()
    expect(buscarAporteBase("")).toBeNull()
  })
})

describe("aLineas", () => {
  it("narrowea el blob jsonb a líneas tipadas", () => {
    const blob = [{ prod: "Urea", dosis: "5", unidad: "kg", obs: "ok" }, "basura"]
    expect(aLineas(blob)).toEqual([
      { prod: "Urea", dosis: 5, unidad: "kg", obs: "ok" },
      { prod: "", dosis: 0, unidad: "", obs: "" },
    ])
  })
  it("devuelve [] si no es array", () => {
    expect(aLineas(null)).toEqual([])
  })
})

describe("aConfigFert", () => {
  it("usa defaults del monolito cuando el blob viene vacío", () => {
    const cfg = aConfigFert(null)
    expect(cfg.formas).toContain("POR GOTEO")
    expect(cfg.unidades).toContain("kg")
    expect(cfg.empresa.length).toBeGreaterThan(0)
  })
  it("respeta las listas presentes en el blob", () => {
    const cfg = aConfigFert({ formas: ["GOTEO X"], temporada: "2027-2028" })
    expect(cfg.formas).toEqual(["GOTEO X"])
    expect(cfg.temporada).toBe("2027-2028")
    expect(cfg.horarios).toContain("08:00 A 17:00")
  })
})
