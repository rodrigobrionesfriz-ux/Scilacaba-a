import { asc, isNotNull } from "drizzle-orm"
import { db } from "@/db/client"
import { costCenters } from "@/db/schema"
import type { CentroCosto } from "@/schemas/centros-costo.schema"

export const getCentrosCosto = async (): Promise<CentroCosto[]> => {
  const rows = await db
    .select()
    .from(costCenters)
    .orderBy(asc(costCenters.codigo))
  return rows.map((r) => ({
    codigo: r.codigo,
    descripcion: r.descripcion,
    area: r.area ?? "",
    responsable: r.responsable ?? "",
    observaciones: r.observaciones ?? "",
    activo: r.activo,
  }))
}

// Áreas existentes (para el datalist del campo "área" del formulario).
export const getAreas = async (): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ area: costCenters.area })
    .from(costCenters)
    .where(isNotNull(costCenters.area))
    .orderBy(asc(costCenters.area))
  return rows.map((r) => r.area).filter((a): a is string => Boolean(a))
}
