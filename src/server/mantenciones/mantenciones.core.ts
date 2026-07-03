import { eq, sql } from "drizzle-orm"
import {
  MANT_GRUPO_PRODUCTO,
  MANT_TIPO_PRODUCTO,
  MANT_UNIDAD_PRODUCTO,
  MANT_WAREHOUSE_ID,
  MANT_WAREHOUSE_NOMBRE,
  PREFIJO_OT,
  type ProductoServicio,
} from "@/constants/mantenciones.constants"
import type { db } from "@/db/client"
import { counters, maintenanceOrders, products, warehouses } from "@/db/schema"
import {
  formatNumeroOT,
  resolverProductoServicio,
} from "@/utils/mantenciones.utils"

// Handle de transacción de drizzle (mismo query builder que `db`), tipado por
// inferencia para no usar any/as (regla 11). Los helpers corren dentro de la
// transacción de la action que factura/crea la OT.
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

// Extrae el entero de un correlativo "OT-000123" → 123 (0 si no parsea).
const numeroOTaEntero = (numero: string): number => {
  const n = Number.parseInt(numero.replace(/\D/g, ""), 10)
  return Number.isFinite(n) ? n : 0
}

// Asegura la bodega de servicios BSERV (idempotente). Necesaria para el movimiento
// de factura (FK bodega). Paridad monolito: ensureBodegaServicios.
export const ensureBodegaServicios = async (tx: Tx): Promise<void> => {
  await tx
    .insert(warehouses)
    .values({
      id: MANT_WAREHOUSE_ID,
      nombre: MANT_WAREHOUSE_NOMBRE,
      esServicios: true,
      activo: true,
    })
    .onConflictDoNothing({ target: warehouses.id })
}

// Asegura el producto de servicio genérico de la categoría (no inventariable) y
// devuelve su código/descripción. FK de movement_lines → products. Paridad monolito.
export const ensureProductoServicio = async (
  tx: Tx,
  categoria: string,
): Promise<ProductoServicio> => {
  const prod = resolverProductoServicio(categoria)
  await tx
    .insert(products)
    .values({
      codigoInterno: prod.codigo,
      descripcion: prod.descripcion,
      unidadMedida: MANT_UNIDAD_PRODUCTO,
      tipoProducto: MANT_TIPO_PRODUCTO,
      grupo: MANT_GRUPO_PRODUCTO,
      subGrupo: categoria,
      inventariable: false,
      activo: true,
    })
    .onConflictDoNothing({ target: products.codigoInterno })
  return prod
}

// Correlativo atómico de OT sin huecos. Siembra el counter al max existente si aún
// no existe (el migrador no lo sembró: OT era perezoso en el monolito) para no
// colisionar con las OT migradas. Mismo patrón atómico que OA/Tomas.
export const siguienteNumeroOT = async (tx: Tx): Promise<string> => {
  const actual = await tx
    .select({ valor: counters.valor })
    .from(counters)
    .where(eq(counters.clave, PREFIJO_OT))
    .limit(1)
  if (!actual.length) {
    const filas = await tx
      .select({ numero: maintenanceOrders.numero })
      .from(maintenanceOrders)
    const max = filas.reduce((m, f) => Math.max(m, numeroOTaEntero(f.numero)), 0)
    await tx
      .insert(counters)
      .values({ clave: PREFIJO_OT, valor: max })
      .onConflictDoNothing({ target: counters.clave })
  }
  const [counter] = await tx
    .insert(counters)
    .values({ clave: PREFIJO_OT, valor: 1 })
    .onConflictDoUpdate({
      target: counters.clave,
      set: { valor: sql`${counters.valor} + 1` },
    })
    .returning({ valor: counters.valor })
  return formatNumeroOT(counter.valor)
}
