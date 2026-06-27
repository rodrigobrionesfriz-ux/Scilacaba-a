import { budgetMeta, budgetRows } from "@/db/schema"
import type { PresupuestoPayload } from "@/schemas/firestore-presupuesto.schema"
import { toIntOrNull, toNumericString } from "@/utils/migracion.utils"

export type FilasPresupuesto = {
  budgetRows: (typeof budgetRows.$inferInsert)[]
  budgetMeta: (typeof budgetMeta.$inferInsert)[]
}

const toNum = (x: unknown): number | null => {
  if (x == null || x === "") return null
  const n = Number(x)
  return Number.isFinite(n) ? n : null
}

// Doc presupuesto/main → budget_rows (filas mensuales) + budget_meta (singleton).
// Las llaves del origen vienen con espacios/acentos (tal cual el Excel).
export const transformPresupuesto = (
  pr: PresupuestoPayload,
): FilasPresupuesto => {
  const rowsRows: FilasPresupuesto["budgetRows"] = (pr.rows ?? []).map((r) => ({
    mes: r.MES ?? "",
    anio: toIntOrNull(r["AÑO"]),
    subGrupo: r["SUB-GRUPO"] ?? null,
    tipoCosto: r["TIPO DE COSTO"] ?? null,
    descripcion: r.DESCRIPCION ?? null,
    temporada: r.TEMPORADA ?? null,
    pptoClp: toNumericString(r.PPTO_CLP),
    realClp: toNumericString(r.REAL_CLP),
    pptoUsd: toNumericString(r.PPTO_USD),
    realUsd: toNumericString(r.REAL_USD),
    mesOrder: toIntOrNull(r.MES_ORDER),
  }))

  const tieneMeta =
    (pr.rows?.length ?? 0) > 0 ||
    pr.detalle != null ||
    pr.monthsWithReal != null ||
    pr.kpis != null
  const metaRows: FilasPresupuesto["budgetMeta"] = tieneMeta
    ? [
        {
          id: "main",
          detalle: pr.detalle ?? null,
          monthsWithReal: pr.monthsWithReal ?? null,
          kpis: pr.kpis
            ? {
                kg: toNum(pr.kpis.kg),
                tc: toNum(pr.kpis.tc),
                ha: toNum(pr.kpis.ha),
                kgEst: toNum(pr.kpis.kgEst),
              }
            : null,
        },
      ]
    : []

  return { budgetRows: rowsRows, budgetMeta: metaRows }
}
