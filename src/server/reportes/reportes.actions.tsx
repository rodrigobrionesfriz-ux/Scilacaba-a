"use server"

import { type DocumentProps, renderToBuffer } from "@react-pdf/renderer"
import type { ReactElement } from "react"
import { presupuestoPdfSchema } from "@/schemas/presupuesto.schema"
import { requirePermiso } from "@/server/auth/auth.queries"
import { getConfirmaciones } from "@/server/confirmaciones/confirmaciones.queries"
import { getInvplantas } from "@/server/invplantas/invplantas.queries"
import { getPresupuesto } from "@/server/presupuesto/presupuesto.queries"
import type { ExportResult } from "@/types/export.types"
import { resumenPorPano } from "@/utils/invplantas.utils"
import {
  calcularKpis,
  filtrarFilas,
  topDesviaciones,
} from "@/utils/presupuesto.utils"
import { AplicacionesConfirmadasPdf } from "./aplicaciones-confirmadas.pdf"
import { PresupuestoPdf } from "./presupuesto.pdf"
import { ResumenInvplantasPdf } from "./resumen-invplantas.pdf"

// Fecha de generación (es-CL) para la cabecera de los reportes.
const generado = (): string => new Date().toLocaleString("es-CL")

// Renderiza un documento react-pdf a base64 (transporte compartido con Excel).
const aBase64 = async (doc: ReactElement<DocumentProps>): Promise<string> => {
  const buffer = await renderToBuffer(doc)
  return Buffer.from(buffer).toString("base64")
}

// Resumen de inventario de huerto (por cuartel) en PDF.
export const exportarResumenInvplantasPdf =
  async (): Promise<ExportResult> => {
    await requirePermiso("invplantas.ver")
    const filas = await getInvplantas()
    const resumen = resumenPorPano(filas)
    const base64 = await aBase64(
      <ResumenInvplantasPdf resumen={resumen} generado={generado()} />,
    )
    return { ok: true, base64, filename: "resumen-invplantas.pdf" }
  }

// Aplicaciones confirmadas del Cuaderno de Campo en PDF.
export const exportarAplicacionesConfirmadasPdf =
  async (): Promise<ExportResult> => {
    await requirePermiso("cuaderno.ver")
    const confirmaciones = await getConfirmaciones()
    const base64 = await aBase64(
      <AplicacionesConfirmadasPdf
        confirmaciones={confirmaciones}
        generado={generado()}
      />,
    )
    return { ok: true, base64, filename: "aplicaciones-confirmadas.pdf" }
  }

// Reporte gerencial de presupuesto (KPIs + Top Desviaciones) en PDF. El
// servidor recomputa la vista con los filtros/moneda del dashboard.
export const exportarPresupuestoPdf = async (
  input: unknown,
): Promise<ExportResult> => {
  await requirePermiso("presupuesto.ver")
  const parsed = presupuestoPdfSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    }
  const { moneda, filtros } = parsed.data
  const { rows } = await getPresupuesto()
  const filtradas = filtrarFilas(rows, filtros)
  const base64 = await aBase64(
    <PresupuestoPdf
      kpis={calcularKpis(filtradas, moneda)}
      top={topDesviaciones(filtradas, moneda)}
      moneda={moneda}
      generado={generado()}
    />,
  )
  return { ok: true, base64, filename: "presupuesto.pdf" }
}
