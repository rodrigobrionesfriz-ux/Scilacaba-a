"use server"

import { eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { COUNTER_PRODUCTO } from "@/constants/productos.constants"
import { db } from "@/db/client"
import { counters, movementLines, products } from "@/db/schema"
import { construirExcel } from "@/lib/xlsx"
import { type Producto, productoSchema } from "@/schemas/productos.schema"
import { registrarAuditoria } from "@/server/audit/audit.core"
import { requirePermiso } from "@/server/auth/auth.queries"
import { getProductos } from "@/server/productos/productos.queries"
import type { ActionResult } from "@/types/action.types"
import type { ExportResult } from "@/types/export.types"
import { formatCodigoProducto } from "@/utils/productos.utils"

// Correlativo de código interno: incremento atómico del counter "PRODUCTO".
// onConflict cubre el caso sin fila previa.
const generarCodigo = async (): Promise<string> => {
  const [row] = await db
    .insert(counters)
    .values({ clave: COUNTER_PRODUCTO, valor: 1 })
    .onConflictDoUpdate({
      target: counters.clave,
      set: { valor: sql`${counters.valor} + 1` },
    })
    .returning({ valor: counters.valor })
  return formatCodigoProducto(row.valor)
}

// Columnas de la tabla products derivadas del input validado (strings vacíos → null;
// numéricos → string para drizzle numeric).
const aColumnas = (data: Producto) => ({
  descripcion: data.descripcion,
  unidadMedida: data.unidadMedida,
  tipoProducto: data.tipoProducto,
  grupo: data.grupo,
  subGrupo: data.subGrupo || null,
  codigoEan: data.codigoEan || null,
  manejaAtributos: data.manejaAtributos,
  inventariable: data.inventariable,
  stockMinimo: String(data.stockMinimo),
  aplicaIva: data.aplicaIva,
  aplicaIec: data.aplicaIec,
  aplicaIla: data.aplicaIla,
  ccTipo: data.ccTipo || null,
  ccIngredienteActivo: data.ccIngredienteActivo || null,
  ccObjetivo: data.ccObjetivo || null,
  ccDosis: data.ccDosis === null ? null : String(data.ccDosis),
  ccUnidad: data.ccUnidad || null,
  activo: data.activo,
})

export const crearProducto = async (input: unknown): Promise<ActionResult> => {
  const usuario = await requirePermiso("productos.crear")
  const parsed = productoSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const data = parsed.data
  if (data.codigoEan) {
    const existe = await db.query.products.findFirst({
      where: eq(products.codigoEan, data.codigoEan),
    })
    if (existe) return { ok: false, error: "El código EAN ya existe" }
  }
  const codigoInterno = await generarCodigo()
  await db.insert(products).values({ codigoInterno, ...aColumnas(data) })
  await registrarAuditoria({
    usuario: usuario.id,
    accion: "producto.crear",
    detalle: data.descripcion,
    referencia: codigoInterno,
  })
  revalidatePath("/productos")
  return { ok: true }
}

export const editarProducto = async (
  codigoInterno: string,
  input: unknown,
): Promise<ActionResult> => {
  const usuario = await requirePermiso("productos.crear")
  const parsed = productoSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const data = parsed.data
  const actual = await db.query.products.findFirst({
    where: eq(products.codigoInterno, codigoInterno),
  })
  if (!actual) return { ok: false, error: "Producto no encontrado" }
  // No cambiar "maneja atributos" si ya hay movimientos (index.html:5049).
  if (actual.manejaAtributos !== data.manejaAtributos) {
    const conMovs = await db.query.movementLines.findFirst({
      where: eq(movementLines.codigoInterno, codigoInterno),
    })
    if (conMovs)
      return {
        ok: false,
        error: "No se puede cambiar 'maneja atributos': el producto tiene movimientos",
      }
  }
  if (data.codigoEan && data.codigoEan !== actual.codigoEan) {
    const existe = await db.query.products.findFirst({
      where: eq(products.codigoEan, data.codigoEan),
    })
    if (existe) return { ok: false, error: "El código EAN ya existe" }
  }
  await db
    .update(products)
    .set({ ...aColumnas(data), modificadoAt: new Date() })
    .where(eq(products.codigoInterno, codigoInterno))
  await registrarAuditoria({
    usuario: usuario.id,
    accion: "producto.editar",
    detalle: data.descripcion,
    referencia: codigoInterno,
  })
  revalidatePath("/productos")
  return { ok: true }
}

export const eliminarProducto = async (
  codigoInterno: string,
): Promise<ActionResult> => {
  await requirePermiso("productos.eliminar")
  // Hard delete solo si no tiene movimientos asociados (index.html:5116-5127).
  const conMovs = await db.query.movementLines.findFirst({
    where: eq(movementLines.codigoInterno, codigoInterno),
  })
  if (conMovs)
    return {
      ok: false,
      error: "No se puede eliminar: el producto tiene movimientos asociados",
    }
  await db.delete(products).where(eq(products.codigoInterno, codigoInterno))
  revalidatePath("/productos")
  return { ok: true }
}

// Exporta el catálogo de productos a Excel (generado en el servidor, SPEC).
export const exportarProductosExcel = async (): Promise<ExportResult> => {
  await requirePermiso("productos.ver")
  const productos = await getProductos()
  const base64 = await construirExcel([
    {
      nombre: "Productos",
      columnas: [
        { header: "Código", key: "codigoInterno", width: 14 },
        { header: "Descripción", key: "descripcion", width: 36 },
        { header: "U.M.", key: "unidadMedida", width: 10 },
        { header: "Tipo", key: "tipoProducto", width: 18 },
        { header: "Grupo", key: "grupo", width: 18 },
        { header: "Sub-grupo", key: "subGrupo", width: 18 },
        { header: "EAN", key: "codigoEan", width: 16 },
        { header: "Inventariable", key: "inventariable", width: 14 },
        { header: "Stock mínimo", key: "stockMinimo", width: 14 },
        { header: "Activo", key: "activo", width: 10 },
      ],
      filas: productos.map((p) => ({
        ...p,
        inventariable: p.inventariable ? "Sí" : "No",
        activo: p.activo ? "Sí" : "No",
      })),
    },
  ])
  return { ok: true, base64, filename: "productos.xlsx" }
}
