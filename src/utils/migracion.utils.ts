// Helpers de coerción para el migrador Firestore → Postgres.
// Puros y testeables; los usa la capa transform del migrador (scripts/migracion).

// ISO con hora → Date (para columnas timestamptz). Inválida/ausente → null.
export const parseTimestamp = (value: unknown): Date | null => {
  if (value == null || value === "") return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === "number" || typeof value === "string") {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

// epoch ms (_mod) → Date. Inválido → null.
export const parseEpochMs = (value: unknown): Date | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

// "YYYY-MM-DD" (o ISO con hora) → "YYYY-MM-DD" para columnas date. Inválida → null.
export const parseDateOnly = (value: unknown): string | null => {
  if (typeof value === "string" && value !== "") {
    const m = value.match(/^(\d{4}-\d{2}-\d{2})/)
    if (m) return m[1]
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
  }
  if (value instanceof Date && !Number.isNaN(value.getTime()))
    return value.toISOString().slice(0, 10)
  return null
}

// Cualquier cosa → string numérico para columnas numeric de Drizzle. No finito → "0".
export const toNumericString = (value: unknown): string => {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? String(n) : "0"
}

// number entero | null para columnas integer/bigint. No finito → null.
export const toIntOrNull = (value: unknown): number | null => {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

// Booleano con semántica "ausente = true" (inventariable, activo, aplicaIVA, manejaAtributos en algunos casos).
export const boolDefaultTrue = (value: unknown): boolean => value !== false

// Booleano con semántica "ausente = false" (anulado, sincronizado...).
export const boolDefaultFalse = (value: unknown): boolean => value === true

// RUT chileno: cuerpo sin DV (= codigo de proveedor/cliente). null si no parseable.
export const rutBody = (value: unknown): string | null => {
  if (typeof value !== "string") return null
  const limpio = value.replace(/[^0-9kK]/g, "").toUpperCase()
  return limpio.length < 2 ? null : limpio.slice(0, -1)
}

// Valida el dígito verificador del RUT (módulo 11). false si formato inválido.
export const rutValido = (value: unknown): boolean => {
  if (typeof value !== "string") return false
  const limpio = value.replace(/[^0-9kK]/g, "").toUpperCase()
  if (limpio.length < 2) return false
  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)
  if (!/^\d+$/.test(cuerpo)) return false
  let suma = 0
  let factor = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor
    factor = factor === 7 ? 2 : factor + 1
  }
  const resto = 11 - (suma % 11)
  const dvEsperado = resto === 11 ? "0" : resto === 10 ? "K" : String(resto)
  return dv === dvEsperado
}
