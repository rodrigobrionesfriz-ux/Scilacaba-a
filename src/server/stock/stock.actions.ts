"use server"

import { construirExcel } from "@/lib/xlsx"
import { requirePermiso } from "@/server/auth/auth.queries"
import { getStock } from "@/server/stock/stock.queries"
import type { ExportResult } from "@/types/export.types"

// Exporta el stock por producto/bodega a Excel (generado en el servidor, SPEC).
export const exportarStockExcel = async (): Promise<ExportResult> => {
  await requirePermiso("stock.ver")
  const stock = await getStock()
  const base64 = await construirExcel([
    {
      nombre: "Stock",
      columnas: [
        { header: "Código", key: "codigoInterno", width: 14 },
        { header: "Descripción", key: "descripcion", width: 36 },
        { header: "U.M.", key: "unidadMedida", width: 10 },
        { header: "Bodega", key: "bodega", width: 24 },
        { header: "Cantidad", key: "cantidad", width: 14 },
        { header: "Costo promedio", key: "costoPromedio", width: 16 },
        { header: "Valor", key: "valor", width: 16 },
      ],
      filas: stock,
    },
  ])
  return { ok: true, base64, filename: "stock.xlsx" }
}
