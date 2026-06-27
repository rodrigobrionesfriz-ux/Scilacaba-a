import { describe, expect, it } from "vitest"
import {
  boolDefaultFalse,
  boolDefaultTrue,
  parseDateOnly,
  parseEpochMs,
  parseTimestamp,
  rutBody,
  rutValido,
  toBigIntId,
  toIntOrNull,
  toNumericString,
  toStringArray,
} from "./migracion.utils"

describe("parseTimestamp", () => {
  it("parsea ISO con hora a Date", () => {
    const d = parseTimestamp("2026-06-26T12:00:00.000Z")
    expect(d?.toISOString()).toBe("2026-06-26T12:00:00.000Z")
  })
  it("vacío/ausente/ inválido → null", () => {
    expect(parseTimestamp("")).toBeNull()
    expect(parseTimestamp(null)).toBeNull()
    expect(parseTimestamp("no es fecha")).toBeNull()
  })
})

describe("parseEpochMs", () => {
  it("epoch ms → Date", () => {
    expect(parseEpochMs(1782514944590)?.getTime()).toBe(1782514944590)
  })
  it("no número → null", () => {
    expect(parseEpochMs("123")).toBeNull()
  })
})

describe("parseDateOnly", () => {
  it("conserva YYYY-MM-DD", () => {
    expect(parseDateOnly("2026-06-26")).toBe("2026-06-26")
  })
  it("recorta ISO con hora", () => {
    expect(parseDateOnly("2026-06-26T23:59:59Z")).toBe("2026-06-26")
  })
  it("vacío/inválido → null", () => {
    expect(parseDateOnly("")).toBeNull()
    expect(parseDateOnly("xx")).toBeNull()
  })
})

describe("toNumericString", () => {
  it("numéricos → string", () => {
    expect(toNumericString(5)).toBe("5")
    expect(toNumericString("3.14")).toBe("3.14")
  })
  it("no finito → '0'", () => {
    expect(toNumericString(undefined)).toBe("0")
    expect(toNumericString("abc")).toBe("0")
  })
})

describe("toIntOrNull", () => {
  it("trunca a entero", () => {
    expect(toIntOrNull("12.9")).toBe(12)
  })
  it("no finito → null", () => {
    expect(toIntOrNull("abc")).toBeNull()
  })
})

describe("toBigIntId", () => {
  it("conserva id epoch-ms grande", () => {
    expect(toBigIntId(1778613683269)).toBe(1778613683269)
  })
  it("no parseable → null", () => {
    expect(toBigIntId(null)).toBeNull()
  })
})

describe("toStringArray", () => {
  it("coacciona number|string a string[]", () => {
    expect(toStringArray([1, "2", 3])).toEqual(["1", "2", "3"])
  })
  it("no array → null; descarta nullish", () => {
    expect(toStringArray(undefined)).toBeNull()
    expect(toStringArray([1, null, 2])).toEqual(["1", "2"])
  })
})

describe("booleanos con default", () => {
  it("default true: solo false explícito es false", () => {
    expect(boolDefaultTrue(undefined)).toBe(true)
    expect(boolDefaultTrue(true)).toBe(true)
    expect(boolDefaultTrue(false)).toBe(false)
  })
  it("default false: solo true explícito es true", () => {
    expect(boolDefaultFalse(undefined)).toBe(false)
    expect(boolDefaultFalse(true)).toBe(true)
  })
})

describe("RUT", () => {
  it("rutBody quita puntos, guion y DV", () => {
    expect(rutBody("12.345.678-5")).toBe("12345678")
    expect(rutBody("9.876.543-K")).toBe("9876543")
  })
  it("rutValido verifica el dígito verificador", () => {
    expect(rutValido("11.111.111-1")).toBe(true)
    expect(rutValido("11.111.111-2")).toBe(false)
  })
})
