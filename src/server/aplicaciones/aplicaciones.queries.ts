import { desc, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { fieldRecords, panos } from "@/db/schema"
import type { AplicacionRow } from "@/types/aplicaciones.types"

// Listado de aplicaciones (field_records) con el nombre del paño resuelto vía
// join. Orden por fecha descendente (las más recientes primero).
export const getAplicaciones = async (): Promise<AplicacionRow[]> => {
  const rows = await db
    .select({
      id: fieldRecords.id,
      fecha: fieldRecords.fecha,
      panoId: fieldRecords.panoId,
      panoNombre: panos.nombre,
      tipo: fieldRecords.tipo,
      producto: fieldRecords.producto,
      dosis: fieldRecords.dosis,
      unidad: fieldRecords.unidad,
      metodo: fieldRecords.metodo,
      operador: fieldRecords.operador,
      obs: fieldRecords.obs,
      lote: fieldRecords.lote,
    })
    .from(fieldRecords)
    .leftJoin(panos, eq(fieldRecords.panoId, panos.id))
    .orderBy(desc(fieldRecords.fecha))
  return rows.map((r) => ({
    id: r.id,
    fecha: r.fecha ?? "",
    panoId: r.panoId,
    panoNombre: r.panoNombre ?? "",
    tipo: r.tipo ?? "",
    producto: r.producto ?? "",
    dosis: r.dosis ?? "",
    unidad: r.unidad ?? "",
    metodo: r.metodo ?? "",
    operador: r.operador ?? "",
    obs: r.obs ?? "",
    lote: r.lote ?? "",
  }))
}
