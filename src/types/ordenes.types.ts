// Tipos del Cuaderno · Órdenes de aplicación (regla 12). Hoja: solo importa
// constantes. Reflejan los blobs jsonb de application_orders (verbatim del
// monolito S.ordenes) y las filas que consume la UI.

import type { ESTADOS_ORDEN } from "@/constants/cuaderno.constants"

export type EstadoOrden = (typeof ESTADOS_ORDEN)[number]

// Producto dentro de la mezcla de una OA (blob jsonb productos[]).
// unitS = unidad base (sin "/ha" ni "/100L"); tProd = total a aplicar.
export type ProductoOrden = {
  nombre: string
  dosis: number
  unidad: string
  unitS: string
  tProd: number
  margin: number
}

// Cantidad de un producto repartida a un paño concreto.
export type ProdDistribuido = {
  nombre: string
  qty: number
  unitS: string
  unidad: string
  dosis: number
}

// Fila de la distribución por paño (blob jsonb distribucion[]).
export type DistribucionPano = {
  panoId: string
  panoNombre: string
  variedad: string
  anio: string
  color: string
  has: number
  agua: number
  prod: number
  prods: ProdDistribuido[]
}

// Producto realmente aplicado en una confirmación (blob jsonb productosReales[]).
export type ProductoReal = {
  nombre: string
  qtyAplicada: number
  unitS: string
}

// Fila del listado de órdenes (estado y nConfirmaciones se derivan en la query).
export type OrdenRow = {
  id: number
  numero: string
  fecha: string
  tipoApp: string
  fenologico: string
  especie: string
  responsable: string
  metodo: string
  objetivos: string[]
  objetivoOtro: string
  panoIds: string[]
  productos: ProductoOrden[]
  distribucion: DistribucionPano[]
  moj: number
  vha: number
  mojT: number
  tHas: number
  tAgua: number
  tProd: number
  notas: string
  editada: boolean
  estado: EstadoOrden
  nConfirmaciones: number
}

// Fila del listado de confirmaciones.
export type ConfirmacionRow = {
  id: number
  ordenId: number | null
  ordenNumero: string
  fechaApp: string
  horaInicio: string
  horaFin: string
  operador: string
  equipo: string
  turno: string
  tempAmb: number | null
  humedad: number | null
  viento: number | null
  condClima: string
  panoIds: string[]
  productosReales: ProductoReal[]
  aguaReal: number | null
  notas: string
}
