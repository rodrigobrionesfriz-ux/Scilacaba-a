"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db/client"
import { movementLines, movements } from "@/db/schema"
import { movimientoSchema } from "@/schemas/movimientos.schema"
import { getUsuarioActual, requirePermiso } from "@/server/auth/auth.queries"
import { insertarMovimiento } from "@/server/inventario/inventario.core"
import { recalcularStockScoped } from "@/server/inventario/inventario.recalc"
import type { ActionResult } from "@/types/action.types"

// Revalida las rutas que dependen de stock/movimientos (incluye las columnas de
// stock diferidas en los maestros Productos y Bodegas).
const revalidar = () => {
  revalidatePath("/movimientos")
  revalidatePath("/stock")
  revalidatePath("/productos")
  revalidatePath("/bodegas")
}

export const crearMovimiento = async (
  input: unknown,
): Promise<ActionResult> => {
  await requirePermiso("movimientos.crear")
  const parsed = movimientoSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }
  const data = parsed.data

  const usuario = await getUsuarioActual()
  if (!usuario) return { ok: false, error: "Sesión no válida" }

  const codigos = [...new Set(data.lineas.map((l) => l.codigoInterno))]

  try {
    await db.transaction(async (tx) => {
      await insertarMovimiento(tx, {
        tipoMovimiento: data.tipoMovimiento,
        fecha: new Date(data.fecha),
        bodegaId: data.bodegaId,
        bodegaDestinoId: data.bodegaDestinoId,
        documento: data.documento,
        tipoDoc: data.tipoDoc,
        numeroDoc: data.numeroDoc,
        proveedorCodigo: data.proveedorCodigo,
        clienteCodigo: data.clienteCodigo,
        centroCosto: data.centroCosto,
        observaciones: data.observaciones,
        usuario: usuario.nombre,
        autorizadoPor: data.autorizadoPor,
        lineas: data.lineas,
      })

      // Recálculo PPP acotado a los productos afectados. El motor hace floor a 0 en
      // salidas y origen de traspaso: el stock negativo se permite (paridad con el
      // monolito) — intencional, no se valida ni bloquea.
      await recalcularStockScoped(tx, codigos)
    })
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo crear el movimiento",
    }
  }

  revalidar()
  return { ok: true }
}

export const anularMovimiento = async (
  numero: string,
): Promise<ActionResult> => {
  await requirePermiso("movimientos.anular")

  const mov = await db.query.movements.findFirst({
    where: eq(movements.numero, numero),
  })
  if (!mov) return { ok: false, error: "Movimiento no encontrado" }
  if (mov.anulado) return { ok: false, error: "El movimiento ya está anulado" }

  await db.transaction(async (tx) => {
    await tx
      .update(movements)
      .set({ anulado: true, updatedAt: new Date() })
      .where(eq(movements.numero, numero))

    const lineas = await tx
      .select({ codigoInterno: movementLines.codigoInterno })
      .from(movementLines)
      .where(eq(movementLines.movementNumero, numero))
    const codigos = [...new Set(lineas.map((l) => l.codigoInterno))]

    // El motor filtra los anulados, así el movimiento sale de la reproducción y
    // el stock/lots de esos códigos se corrige solo.
    await recalcularStockScoped(tx, codigos)
  })

  revalidar()
  return { ok: true }
}
