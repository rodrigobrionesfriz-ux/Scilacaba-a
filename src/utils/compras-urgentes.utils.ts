import type { CompraUrgente, OrdenFaltante } from "@/types/compras-urgentes.types"

// Producto de una orden reducido a lo que necesita el cruce con stock.
export type ProductoOrdenCU = { nombre: string; unidad: string; tProd: number }
export type OrdenParaCU = {
  id: number
  numero: string
  fecha: string
  productos: ProductoOrdenCU[]
}

// Normalización de nombre para el match producto↔catálogo (igual que el monolito).
export const normalizarNombreProducto = (s: string): string =>
  s.trim().replace(/\s+/g, " ").toUpperCase()

// Cruza lo requerido por cada orden vs el stock actual y agrupa por producto.
// disponible = stock total actual del producto (mismo valor entre órdenes);
// totalFalta = suma de faltantes por orden (semántica del monolito: cada orden
// necesita su propio suministro). Sin match en catálogo → "no está en bodega".
export const construirComprasUrgentes = (
  ordenes: OrdenParaCU[],
  codigoPorNombre: Map<string, string>,
  stockPorCodigo: Map<string, number>,
): CompraUrgente[] => {
  const grupos = new Map<string, CompraUrgente>()
  for (const orden of ordenes) {
    for (const p of orden.productos) {
      const requerido = p.tProd
      if (!(requerido > 0)) continue
      const codigo = codigoPorNombre.get(normalizarNombreProducto(p.nombre))
      const enBodega = codigo !== undefined
      const disponible = codigo ? (stockPorCodigo.get(codigo) ?? 0) : 0
      const falta = requerido - disponible
      if (!(falta > 0)) continue
      const clave = normalizarNombreProducto(p.nombre)
      const existente = grupos.get(clave)
      const detalle: OrdenFaltante = {
        id: orden.id,
        numero: orden.numero,
        fecha: orden.fecha,
        requerido,
        falta,
      }
      if (existente) {
        existente.totalFalta += falta
        existente.ordenes.push(detalle)
      } else {
        grupos.set(clave, {
          producto: p.nombre,
          unidad: p.unidad,
          disponible,
          enBodega,
          totalFalta: falta,
          ordenes: [detalle],
        })
      }
    }
  }
  return [...grupos.values()].sort((a, b) => b.totalFalta - a.totalFalta)
}
