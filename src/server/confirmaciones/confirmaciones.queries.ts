import { desc } from "drizzle-orm"
import { db } from "@/db/client"
import { applicationConfirmations } from "@/db/schema"
import type { ConfirmacionRow } from "@/types/ordenes.types"
import { aProductosReales } from "@/utils/ordenes.utils"

// Listado de confirmaciones (más recientes primero). El número de orden viene
// denormalizado en la propia fila (ordenNumero).
export const getConfirmaciones = async (): Promise<ConfirmacionRow[]> => {
  const rows = await db
    .select()
    .from(applicationConfirmations)
    .orderBy(desc(applicationConfirmations.fechaApp))
  return rows.map((r) => ({
    id: r.id,
    ordenId: r.ordenId,
    ordenNumero: r.ordenNumero ?? "",
    fechaApp: r.fechaApp ?? "",
    horaInicio: r.horaInicio ?? "",
    horaFin: r.horaFin ?? "",
    operador: r.operador ?? "",
    equipo: r.equipo ?? "",
    turno: r.turno ?? "",
    tempAmb: r.tempAmb === null ? null : Number(r.tempAmb),
    humedad: r.humedad === null ? null : Number(r.humedad),
    viento: r.viento === null ? null : Number(r.viento),
    condClima: r.condClima ?? "",
    panoIds: r.panoIds ?? [],
    productosReales: aProductosReales(r.productosReales),
    aguaReal: r.aguaReal === null ? null : Number(r.aguaReal),
    notas: r.notas ?? "",
  }))
}
