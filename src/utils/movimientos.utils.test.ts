import { describe, expect, it } from "vitest"
import {
  PREFIJO_MOV,
  TIPOS_MOV_ENT,
  TIPOS_MOV_SAL,
} from "@/constants/movimientos.constants"
import {
  direccionDeTipo,
  esNumeroMovimientoValido,
  formatNumeroMovimiento,
  prefijoDeTipo,
} from "./movimientos.utils"

describe("formatNumeroMovimiento", () => {
  it("formatea PREFIJO-valor sin padding", () => {
    expect(formatNumeroMovimiento("COMP", 42)).toBe("COMP-42")
    expect(formatNumeroMovimiento("VTA", 1)).toBe("VTA-1")
  })
})

describe("esNumeroMovimientoValido", () => {
  it("acepta PREFIJO-N", () => {
    expect(esNumeroMovimientoValido("COMP-42")).toBe(true)
    expect(esNumeroMovimientoValido("VTA-1")).toBe(true)
  })
  it("rechaza formatos inválidos", () => {
    for (const malo of ["comp42", "-5", "COMP-", "COMP-1-2", "123-45"]) {
      expect(esNumeroMovimientoValido(malo)).toBe(false)
    }
  })
})

describe("direccionDeTipo", () => {
  it("ENT para todos los tipos de entrada", () => {
    for (const t of TIPOS_MOV_ENT) expect(direccionDeTipo(t)).toBe("ENT")
  })
  it("SAL para todos los tipos de salida", () => {
    for (const t of TIPOS_MOV_SAL) expect(direccionDeTipo(t)).toBe("SAL")
  })
})

describe("prefijoDeTipo", () => {
  it("devuelve el prefijo de cada tipo del catálogo", () => {
    for (const [tipo, prefijo] of Object.entries(PREFIJO_MOV)) {
      expect(prefijoDeTipo(tipo)).toBe(prefijo)
    }
  })
  it("null para un tipo desconocido", () => {
    expect(prefijoDeTipo("INEXISTENTE")).toBeNull()
  })
})
