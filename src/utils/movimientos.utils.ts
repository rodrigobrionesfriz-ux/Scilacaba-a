import {
  PREFIJO_MOV,
  TIPOS_MOV_ENT,
} from "@/constants/movimientos.constants"
import type { Direccion } from "@/types/movimientos.types"

// numero correlativo de un movimiento: PREFIJO-valor (p.ej. "COMP-42").
// Sin padding, por paridad con el monolito y el validador del migrador.
export const formatNumeroMovimiento = (
  prefijo: string,
  valor: number,
): string => `${prefijo}-${valor}`

// Valida el formato PREFIJO-N (letras, guion, dígitos), igual que el migrador.
export const esNumeroMovimientoValido = (numero: string): boolean =>
  /^[A-Za-z]+-\d+$/.test(numero)

// Dirección (ENT/SAL) a partir del tipo de movimiento. Los tipos válidos los
// garantiza el schema; un tipo de entrada → ENT, cualquier otro → SAL.
export const direccionDeTipo = (tipo: string): Direccion =>
  TIPOS_MOV_ENT.includes(tipo) ? "ENT" : "SAL"

// Prefijo correlativo del tipo (COMPRA → COMP). null si el tipo no existe.
export const prefijoDeTipo = (tipo: string): string | null =>
  PREFIJO_MOV[tipo] ?? null
