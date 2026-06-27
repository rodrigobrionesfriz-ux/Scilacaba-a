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

// number entero | null para columnas integer/bigint. Ausente/no finito → null.
export const toIntOrNull = (value: unknown): number | null => {
  if (value == null || value === "") return null
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

// PK bigint (mode:"number"): ids epoch-ms del cuaderno (caben en 2^53). No finito → null.
export const toBigIntId = (value: unknown): number | null => toIntOrNull(value)

// Array de number|string → string[] (columnas text[] como pano_ids). Ausente → null.
export const toStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null
  return value.filter((v) => v != null).map((v) => String(v))
}

// Booleano con semántica "ausente = true" (inventariable, activo, aplicaIVA, manejaAtributos en algunos casos).
export const boolDefaultTrue = (value: unknown): boolean => value !== false

// Booleano con semántica "ausente = false" (anulado, sincronizado...).
export const boolDefaultFalse = (value: unknown): boolean => value === true

// RUT: helpers movidos a rut.utils.ts (compartidos con los maestros comerciales).
export { rutBody, rutValido } from "./rut.utils"
