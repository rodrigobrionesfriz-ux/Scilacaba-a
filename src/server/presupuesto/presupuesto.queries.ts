import { asc, eq } from "drizzle-orm"
import { PZ_CRITERIOS_KEY } from "@/constants/presupuesto.constants"
import { db } from "@/db/client"
import { budgetMeta, budgetRows, config } from "@/db/schema"
import { requirePermiso } from "@/server/auth/auth.queries"
import type { BudgetMeta, BudgetRow, Criterio } from "@/types/presupuesto.types"
import {
  narrowCriterios,
  narrowDetalle,
  narrowKpisMeta,
} from "@/utils/presupuesto.utils"

// Dataset completo del presupuesto: todas las filas (montos casteados a number,
// el numeric de Postgres llega como string) + los metadatos singleton (id="main").
// La agregación (KPIs/gráficos) es reactiva en el cliente por moneda/filtros.
export const getPresupuesto = async (): Promise<{
  rows: BudgetRow[]
  meta: BudgetMeta | null
}> => {
  await requirePermiso("presupuesto.ver")

  const [filas, metaRow] = await Promise.all([
    db.select().from(budgetRows).orderBy(asc(budgetRows.mesOrder)),
    db.query.budgetMeta.findFirst({ where: eq(budgetMeta.id, "main") }),
  ])

  const rows: BudgetRow[] = filas.map((f) => ({
    id: f.id,
    mes: f.mes,
    anio: f.anio,
    subGrupo: f.subGrupo ?? "",
    tipoCosto: f.tipoCosto ?? "",
    descripcion: f.descripcion ?? "",
    temporada: f.temporada ?? "",
    pptoClp: Number(f.pptoClp),
    realClp: Number(f.realClp),
    pptoUsd: Number(f.pptoUsd),
    realUsd: Number(f.realUsd),
    mesOrder: f.mesOrder,
  }))

  const meta: BudgetMeta | null = metaRow
    ? {
        monthsWithReal: metaRow.monthsWithReal ?? [],
        kpis: narrowKpisMeta(metaRow.kpis),
        detalle: narrowDetalle(metaRow.detalle),
        updatedAt: metaRow.updatedAt
          ? metaRow.updatedAt.toISOString()
          : null,
      }
    : null

  return { rows, meta }
}

// Criterios por temporada (viven en la fila config `pz_criterios`, blob jsonb).
export const getCriterios = async (): Promise<Criterio[]> => {
  await requirePermiso("presupuesto.ver")
  const fila = await db.query.config.findFirst({
    where: eq(config.clave, PZ_CRITERIOS_KEY),
  })
  return narrowCriterios(fila?.valor)
}
