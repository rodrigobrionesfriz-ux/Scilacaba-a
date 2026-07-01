import type { EstadoPlanta } from "@/types/invplantas.types"

// Tipos de Estimación de cosecha (regla 12). Importa solo tipos de otra
// entidad de terreno (EstadoPlanta). Módulo online (a diferencia de Conteos e
// Invplantas): lee datos ya sincronizados, no captura offline.

// Pesos de producción por estado de planta, en % (default: PESOS_ESTADO_DEFAULT,
// override posible por paño vía panos.prodPct).
export type PesosEstado = Record<EstadoPlanta, number>

// Datos base de una línea (por paño), antes de que el usuario los ajuste.
// `plantasEquiv`/`plantasInvTotal` son null si el paño no tiene invplantas.
export type LineaEstimBase = {
  panoId: number
  panoNombre: string
  variedad: string
  centros: number
  frutosCentro: number
  kgFruto: number
  plantas: number
  // Desglose crudo de plantas por estado (invplantas), para recalcular en vivo
  // al editar los pesos por estado. null si el paño no tiene invplantas.
  desglose: Record<EstadoPlanta, number> | null
  plantasEquiv: number | null
  plantasInvTotal: number | null
  usarEquiv: boolean
  pesosEstado: PesosEstado
}

// Línea de cálculo ya resuelta (con los derivados kg/plantas usadas). Es la
// forma persistida dentro de `estimaciones.lineas[]`.
export type LineaEstimacion = LineaEstimBase & {
  plantasUsadas: number
  kgPano: number
}

// Línea base construida por el servidor para precargar el calculador
// (centros desde conteos, plantas equivalentes desde invplantas).
export type PanoEstimBase = LineaEstimBase

// Fila leída desde Postgres para la lista de versiones guardadas.
export type EstimacionRow = {
  id: string
  nombre: string
  usuario: string
  lineas: LineaEstimacion[]
  totalKg: number | null
  fecha: string
  updatedAt: string | null
}
