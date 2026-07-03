import { describe, expect, it } from "vitest"
import type { BudgetRow } from "@/types/presupuesto.types"
import {
  calcularKpis,
  construirFilasDesdeExcel,
  desviacionPorDescripcion,
  detalleDeDescripcion,
  filtrarFilas,
  indiceMes,
  montoPpto,
  montoReal,
  narrowCriterios,
  narrowDetalle,
  opcionesFiltro,
  porDescripcion,
  porSubGrupo,
  porTipoCosto,
  serieMensual,
  temporadaDeMesAnio,
  topDesviaciones,
} from "./presupuesto.utils"

const fila = (o: Partial<BudgetRow> = {}): BudgetRow => ({
  id: o.id ?? 1,
  mes: o.mes ?? "MAYO",
  anio: o.anio ?? 2025,
  subGrupo: o.subGrupo ?? "OPERACIONALES",
  tipoCosto: o.tipoCosto ?? "COSTOS DIRECTOS",
  descripcion: o.descripcion ?? "Poda",
  temporada: o.temporada ?? "2025-2026",
  pptoClp: o.pptoClp ?? 0,
  realClp: o.realClp ?? 0,
  pptoUsd: o.pptoUsd ?? 0,
  realUsd: o.realUsd ?? 0,
  mesOrder: o.mesOrder ?? 0,
})

describe("indiceMes / temporadaDeMesAnio", () => {
  it("ordena mayo→abril, desconocido = 99", () => {
    expect(indiceMes("MAYO")).toBe(0)
    expect(indiceMes("abril")).toBe(11)
    expect(indiceMes("marte")).toBe(99)
  })

  it("deriva la temporada: mayo..dic → año; ene..abr → año-1", () => {
    expect(temporadaDeMesAnio("MAYO", 2025)).toBe("2025-2026")
    expect(temporadaDeMesAnio("DICIEMBRE", 2025)).toBe("2025-2026")
    expect(temporadaDeMesAnio("ENERO", 2026)).toBe("2025-2026")
    expect(temporadaDeMesAnio("ABRIL", 2026)).toBe("2025-2026")
    expect(temporadaDeMesAnio("MAYO", null)).toBe("")
  })
})

describe("montoPpto / montoReal", () => {
  it("elige la columna según la moneda", () => {
    const f = fila({ pptoClp: 100, pptoUsd: 1, realClp: 80, realUsd: 0.8 })
    expect(montoPpto(f, "CLP")).toBe(100)
    expect(montoPpto(f, "USD")).toBe(1)
    expect(montoReal(f, "CLP")).toBe(80)
    expect(montoReal(f, "USD")).toBe(0.8)
  })
})

describe("filtrarFilas", () => {
  const rows = [
    fila({ mes: "MAYO", tipoCosto: "COSTOS DIRECTOS", descripcion: "Poda" }),
    fila({ mes: "JUNIO", tipoCosto: "GASTOS GENERALES", descripcion: "Riego" }),
  ]
  it("sin filtros devuelve todo", () => {
    expect(
      filtrarFilas(rows, {
        temporada: "",
        mes: "",
        tipoCosto: "",
        subGrupo: "",
        descripcion: "",
      }),
    ).toHaveLength(2)
  })
  it("filtra por mes y compara tipoCosto con trim", () => {
    expect(
      filtrarFilas(rows, {
        temporada: "",
        mes: "MAYO",
        tipoCosto: "COSTOS DIRECTOS",
        subGrupo: "",
        descripcion: "",
      }),
    ).toHaveLength(1)
  })
})

describe("calcularKpis", () => {
  it("suma ppto/real, desviación, meses con real y mayor sobreejecución", () => {
    const rows = [
      fila({ descripcion: "Poda", pptoClp: 100, realClp: 150, mes: "MAYO" }),
      fila({ descripcion: "Riego", pptoClp: 200, realClp: 100, mes: "JUNIO" }),
      fila({ descripcion: "Riego", pptoClp: 0, realClp: 0, mes: "JULIO" }),
    ]
    const k = calcularKpis(rows, "CLP")
    expect(k.ppto).toBe(300)
    expect(k.real).toBe(250)
    expect(k.dev).toBe(-50)
    expect(k.devPct).toBeCloseTo((-50 / 300) * 100)
    expect(k.mesesReal).toBe(2)
    expect(k.avance).toBe(83)
    expect(k.maxOverrun).toEqual({ label: "Poda", monto: 50 })
  })
  it("sin ppto: devPct 0 y avance null", () => {
    const k = calcularKpis([fila({ pptoClp: 0, realClp: 0 })], "CLP")
    expect(k.devPct).toBe(0)
    expect(k.avance).toBeNull()
    expect(k.maxOverrun).toBeNull()
  })
})

describe("series de gráficos", () => {
  const rows = [
    fila({ mes: "MAYO", pptoClp: 100, realClp: 120, subGrupo: "A", tipoCosto: "COSTOS X", descripcion: "d1" }),
    fila({ mes: "JUNIO", pptoClp: 50, realClp: 0, subGrupo: "B", tipoCosto: "GASTOS Y", descripcion: "d2" }),
  ]
  it("serieMensual: 12 meses en orden, real 0 → null", () => {
    const s = serieMensual(rows, "CLP")
    expect(s).toHaveLength(12)
    expect(s[0]).toEqual({ mes: "MAY", ppto: 100, real: 120 })
    expect(s[1]).toEqual({ mes: "JUN", ppto: 50, real: null })
  })
  it("porTipoCosto: limpia prefijos COSTOS/GASTOS", () => {
    const t = porTipoCosto(rows, "CLP")
    expect(t.map((x) => x.label)).toEqual(["X", "Y"])
  })
  it("porSubGrupo: real acumulado, descarta 0", () => {
    const d = porSubGrupo(rows, "CLP")
    expect(d).toEqual([{ label: "A", valor: 120 }])
  })
  it("porDescripcion: filtra sin movimiento", () => {
    const d = porDescripcion(rows, "CLP")
    expect(d.map((x) => x.label)).toEqual(["d1", "d2"])
  })
})

describe("desviaciones", () => {
  const rows = [
    fila({ descripcion: "Sobre", pptoClp: 100, realClp: 180 }),
    fila({ descripcion: "Bajo", pptoClp: 100, realClp: 40 }),
    fila({ descripcion: "Igual", pptoClp: 50, realClp: 50 }),
  ]
  it("desviacionPorDescripcion: asc y excluye dev 0", () => {
    const d = desviacionPorDescripcion(rows, "CLP")
    expect(d.map((x) => x.label)).toEqual(["Bajo", "Sobre"])
    expect(d[0].dev).toBe(-60)
  })
  it("topDesviaciones: por magnitud, con % vs ppto", () => {
    const t = topDesviaciones(rows, "CLP")
    expect(t[0].label).toBe("Sobre")
    expect(t[0].devPct).toBeCloseTo(80)
  })
})

describe("opcionesFiltro", () => {
  it("valores únicos, meses en orden de temporada", () => {
    const rows = [
      fila({ mes: "JUNIO", subGrupo: "B", descripcion: "z" }),
      fila({ mes: "MAYO", subGrupo: "A", descripcion: "a" }),
    ]
    const o = opcionesFiltro(rows)
    expect(o.meses).toEqual(["MAYO", "JUNIO"])
    expect(o.subGrupos).toEqual(["A", "B"])
    expect(o.descripciones).toEqual(["a", "z"])
  })
})

describe("detalleDeDescripcion", () => {
  const detalle = {
    Poda: [
      { desc: "b", proveedor: "p", mes: "JUNIO", total: 2 },
      { desc: "a", proveedor: "p", mes: "MAYO", total: 1 },
    ],
  }
  it("ordena por mes y filtra por mes cuando se pide", () => {
    expect(detalleDeDescripcion(detalle, "Poda", "").map((x) => x.mes)).toEqual([
      "MAYO",
      "JUNIO",
    ])
    expect(detalleDeDescripcion(detalle, "Poda", "MAYO")).toHaveLength(1)
    expect(detalleDeDescripcion(detalle, "Inexistente", "")).toEqual([])
  })
})

describe("construirFilasDesdeExcel", () => {
  const headers = [
    "TIPO",
    "MES",
    "AÑO",
    "SUB-GRUPO",
    "TIPO DE COSTO",
    "DESCRIPCION",
    "MONTO PPTO",
    "MONTO REAL",
    "TC",
  ]
  const base = {
    MES: "MAYO",
    "AÑO": 2025,
    "SUB-GRUPO": "OPERACIONALES",
    "TIPO DE COSTO": "COSTOS DIRECTOS",
    DESCRIPCION: "Poda",
  }

  it("rechaza cuando faltan columnas", () => {
    const r = construirFilasDesdeExcel(["MES"], [{ MES: "MAYO" }])
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain("Columnas faltantes")
  })

  it("mergea PRESUPUESTO/REAL por clave y deriva USD por TC", () => {
    const filas = [
      { ...base, TIPO: "PRESUPUESTO", "MONTO PPTO": 1000, TC: 1000 },
      { ...base, TIPO: "REAL", "MONTO REAL": 800, TC: 1000 },
    ]
    const r = construirFilasDesdeExcel(headers, filas)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.filas).toHaveLength(1)
    const f = r.filas[0]
    expect(f.pptoClp).toBe(1000)
    expect(f.realClp).toBe(800)
    expect(f.pptoUsd).toBeCloseTo(1)
    expect(f.realUsd).toBeCloseTo(0.8)
    expect(f.temporada).toBe("2025-2026")
    expect(f.mesOrder).toBe(0)
    expect(r.monthsWithReal).toEqual(["MAYO"])
    expect(r.tc).toBe(1000)
  })

  it("usa la columna USD explícita cuando viene > 0", () => {
    const filas = [
      {
        ...base,
        TIPO: "PRESUPUESTO",
        "MONTO PPTO": 1000,
        TC: 1000,
        "Ppto USD": 5,
      },
    ]
    const r = construirFilasDesdeExcel([...headers, "Ppto USD"], filas)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.filas[0].pptoUsd).toBe(5)
  })
})

describe("narrowDetalle / narrowCriterios", () => {
  it("narrowea el blob detalle sin `as`", () => {
    const d = narrowDetalle({
      Poda: [{ desc: "x", proveedor: "y", mes: "MAYO", total: "3" }],
      malo: "no-array",
    })
    expect(d.Poda[0]).toEqual({
      desc: "x",
      proveedor: "y",
      mes: "MAYO",
      total: 3,
    })
    expect(d.malo).toBeUndefined()
  })

  it("narrowea criterios y descarta los sin id", () => {
    const cs = narrowCriterios({
      items: [
        { id: "cr_1", temporada: "2025-2026", tipo: "Poda", detalle: "x" },
        { temporada: "sin id" },
      ],
    })
    expect(cs).toHaveLength(1)
    expect(cs[0].id).toBe("cr_1")
  })

  it("blob no válido → []", () => {
    expect(narrowCriterios(null)).toEqual([])
    expect(narrowCriterios({ items: "x" })).toEqual([])
  })
})
