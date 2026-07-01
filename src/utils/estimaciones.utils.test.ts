import { describe, expect, it } from "vitest"
import { PESOS_ESTADO_DEFAULT } from "@/constants/terreno.constants"
import type { PesosEstado } from "@/types/estimaciones.types"
import {
  aCajas,
  aToneladas,
  kgLinea,
  narrowDesglose,
  narrowLinea,
  narrowLineas,
  plantasProductivas,
  plantasUsadas,
  promedioCentrosPano,
  resolverPesos,
  totalKgLineas,
} from "@/utils/estimaciones.utils"

describe("plantasProductivas", () => {
  it("pondera cada estado por su % de producción y redondea a 1 decimal", () => {
    const out = plantasProductivas(
      { sano: 2, debil: 1, muerto: 1, replante: 0, falta: 0 },
      PESOS_ESTADO_DEFAULT as PesosEstado,
    )
    // 2*1 + 1*0.6 + 1*0 + 0*0.3 + 0*0 = 2.6
    expect(out).toEqual({ equiv: 2.6, total: 4 })
  })
  it("con pesos personalizados por paño", () => {
    const pesos: PesosEstado = { sano: 100, debil: 100, muerto: 0, replante: 50, falta: 0 }
    const out = plantasProductivas(
      { sano: 1, debil: 1, muerto: 1, replante: 2, falta: 1 },
      pesos,
    )
    // 1 + 1 + 0 + 1 + 0 = 3
    expect(out).toEqual({ equiv: 3, total: 6 })
  })
})

describe("kgLinea", () => {
  it("multiplica centros x frutos/centro x kg/fruto x plantas", () => {
    expect(kgLinea(2, 2, 0.011, 100)).toBeCloseTo(4.4)
  })
  it("da 0 si falta cualquier factor", () => {
    expect(kgLinea(0, 2, 0.011, 100)).toBe(0)
    expect(kgLinea(2, 2, 0.011, 0)).toBe(0)
  })
})

describe("plantasUsadas", () => {
  it("usa el equivalente cuando usarEquiv y hay dato", () => {
    expect(
      plantasUsadas({ usarEquiv: true, plantas: 50, plantasEquiv: 44.4 }),
    ).toBe(44.4)
  })
  it("cae al conteo directo si no hay equivalente aunque usarEquiv sea true", () => {
    expect(
      plantasUsadas({ usarEquiv: true, plantas: 50, plantasEquiv: null }),
    ).toBe(50)
  })
  it("usa el conteo directo si usarEquiv es false", () => {
    expect(
      plantasUsadas({ usarEquiv: false, plantas: 50, plantasEquiv: 44.4 }),
    ).toBe(50)
  })
})

describe("totalKgLineas", () => {
  it("suma kgPano de todas las líneas", () => {
    expect(totalKgLineas([{ kgPano: 1 }, { kgPano: 2.5 }, { kgPano: 0 }])).toBe(
      3.5,
    )
  })
  it("0 si no hay líneas", () => {
    expect(totalKgLineas([])).toBe(0)
  })
})

describe("aCajas / aToneladas", () => {
  it("convierte kg a cajas (5kg) y toneladas (1000kg)", () => {
    expect(aCajas(10)).toBe(2)
    expect(aToneladas(2000)).toBe(2)
  })
})

describe("promedioCentrosPano", () => {
  const conteos = [
    { panoId: 1, promedioCentros: 10 },
    { panoId: 1, promedioCentros: 20 },
    { panoId: 2, promedioCentros: 5 },
    { panoId: 1, promedioCentros: null },
  ]
  it("promedia los conteos del paño, ignorando null", () => {
    expect(promedioCentrosPano(conteos, 1)).toBe(15)
  })
  it("null si el paño no tiene conteos", () => {
    expect(promedioCentrosPano(conteos, 99)).toBeNull()
  })
})

describe("resolverPesos", () => {
  it("usa los defaults si prodPct no es un objeto", () => {
    expect(resolverPesos(null, PESOS_ESTADO_DEFAULT as PesosEstado)).toEqual(
      PESOS_ESTADO_DEFAULT,
    )
    expect(
      resolverPesos(undefined, PESOS_ESTADO_DEFAULT as PesosEstado),
    ).toEqual(PESOS_ESTADO_DEFAULT)
  })
  it("sobreescribe solo las claves numéricas conocidas", () => {
    const out = resolverPesos(
      { sano: 90, invalido: "x", debil: "no numero" },
      PESOS_ESTADO_DEFAULT as PesosEstado,
    )
    expect(out).toEqual({ ...PESOS_ESTADO_DEFAULT, sano: 90 })
  })
})

describe("narrowDesglose", () => {
  it("narrowea claves numéricas válidas y descarta el resto a 0", () => {
    expect(narrowDesglose({ sano: 90, debil: 5, invalido: "x" })).toEqual({
      sano: 90,
      debil: 5,
      muerto: 0,
      replante: 0,
      falta: 0,
    })
  })
  it("null si no es un objeto", () => {
    expect(narrowDesglose(null)).toBeNull()
    expect(narrowDesglose("no")).toBeNull()
  })
})

describe("narrowLinea / narrowLineas", () => {
  const lineaValida = {
    panoId: 1,
    panoNombre: "Cuartel 1",
    variedad: "Regina",
    centros: 4,
    frutosCentro: 2,
    kgFruto: 0.011,
    plantas: 100,
    desglose: { sano: 90, debil: 5, muerto: 3, replante: 1, falta: 1 },
    plantasEquiv: 90,
    plantasInvTotal: 100,
    usarEquiv: true,
    pesosEstado: PESOS_ESTADO_DEFAULT,
    plantasUsadas: 90,
    kgPano: 7.92,
  }
  it("acepta una línea completa y recalcula kgPano si falta", () => {
    const { kgPano, ...sinKg } = lineaValida
    expect(narrowLinea(sinKg)).toMatchObject({ ...lineaValida, kgPano })
  })
  it("null si no es un objeto o falta panoId", () => {
    expect(narrowLinea("basura")).toBeNull()
    expect(narrowLinea({ panoNombre: "x" })).toBeNull()
  })
  it("narrowLineas descarta entradas malformadas y no-arrays", () => {
    expect(narrowLineas([lineaValida, "basura", 42])).toHaveLength(1)
    expect(narrowLineas("no")).toEqual([])
  })
})
