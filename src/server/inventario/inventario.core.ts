import { inArray, sql } from "drizzle-orm"
import type { db } from "@/db/client"
import { counters, movementLines, movements, products } from "@/db/schema"
import {
  direccionDeTipo,
  formatNumeroMovimiento,
  prefijoDeTipo,
} from "@/utils/movimientos.utils"

// Handle de transacción de drizzle (mismo query builder que `db`), tipado por
// inferencia para no usar any/as (regla 11).
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

// Línea cruda de un movimiento (cantidad/costo numéricos; lote/venc solo se
// persisten si el producto maneja atributos — la función los nulea si no).
export type LineaMovimiento = {
  codigoInterno: string
  descripcion?: string | null
  unidadMedida?: string | null
  cantidad: number
  costo: number
  lote?: string | null
  fechaVenc?: string | null
  loteId?: string | null
}

// Datos para insertar un movimiento. El correlativo (numero) y la dirección los
// deriva la función desde el tipo; el caller solo aporta los datos de negocio.
export type DatosMovimiento = {
  tipoMovimiento: string
  fecha: Date
  bodegaId: string
  bodegaDestinoId?: string | null
  documento?: string | null
  tipoDoc?: string | null
  numeroDoc?: string | null
  proveedorCodigo?: string | null
  clienteCodigo?: string | null
  centroCosto?: string | null
  observaciones?: string | null
  usuario: string
  autorizadoPor?: string | null
  tomaId?: string | null
  tomaNumero?: string | null
  lineas: LineaMovimiento[]
}

// Inserta un movimiento (correlativo atómico + cabecera + líneas) dentro de una
// transacción y devuelve su número. NO recalcula stock: el caller acumula los
// códigos afectados y llama a recalcularStockScoped una sola vez al final (clave
// para que una toma genere TIE+TIS y recalcule en un solo paso). Reusada por
// crearMovimiento y por la autorización de tomas.
export const insertarMovimiento = async (
  tx: Tx,
  datos: DatosMovimiento,
): Promise<string> => {
  const direccion = direccionDeTipo(datos.tipoMovimiento)
  const prefijo = prefijoDeTipo(datos.tipoMovimiento)
  if (!prefijo) throw new Error("Tipo de movimiento inválido")

  // Correlativo atómico por prefijo, sin huecos (mismo patrón que Productos).
  const [counter] = await tx
    .insert(counters)
    .values({ clave: prefijo.toUpperCase(), valor: 1 })
    .onConflictDoUpdate({
      target: counters.clave,
      set: { valor: sql`${counters.valor} + 1` },
    })
    .returning({ valor: counters.valor })
  const numero = formatNumeroMovimiento(prefijo, counter.valor)

  // Atributos de los productos de las líneas (decide si se persiste lote/venc).
  const codigos = [...new Set(datos.lineas.map((l) => l.codigoInterno))]
  const prods = await tx
    .select({
      codigoInterno: products.codigoInterno,
      manejaAtributos: products.manejaAtributos,
    })
    .from(products)
    .where(inArray(products.codigoInterno, codigos))
  const manejaPorCodigo = new Map(
    prods.map((p) => [p.codigoInterno, p.manejaAtributos]),
  )

  await tx.insert(movements).values({
    numero,
    direccion,
    tipoMovimiento: datos.tipoMovimiento,
    fecha: datos.fecha,
    bodegaId: datos.bodegaId,
    bodegaDestinoId: datos.bodegaDestinoId ?? null,
    documento: datos.documento ?? null,
    tipoDoc: datos.tipoDoc ?? null,
    numeroDoc: datos.numeroDoc ?? null,
    proveedorCodigo: datos.proveedorCodigo ?? null,
    clienteCodigo: datos.clienteCodigo ?? null,
    centroCosto: datos.centroCosto ?? null,
    observaciones: datos.observaciones ?? null,
    usuario: datos.usuario,
    autorizadoPor: datos.autorizadoPor ?? null,
    tomaId: datos.tomaId ?? null,
    tomaNumero: datos.tomaNumero ?? null,
  })

  await tx.insert(movementLines).values(
    datos.lineas.map((l) => {
      const maneja = manejaPorCodigo.get(l.codigoInterno) ?? false
      return {
        movementNumero: numero,
        codigoInterno: l.codigoInterno,
        descripcion: l.descripcion || null,
        unidadMedida: l.unidadMedida || null,
        cantidad: String(l.cantidad),
        costo: String(l.costo),
        lote: maneja && l.lote ? l.lote : null,
        fechaVenc: maneja && l.fechaVenc ? l.fechaVenc : null,
        loteId: maneja && l.loteId ? l.loteId : null,
      }
    }),
  )

  return numero
}
