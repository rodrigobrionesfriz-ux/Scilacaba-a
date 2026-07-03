"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PDF_MIME } from "@/constants/export.constants"
import { descargarArchivo } from "@/lib/descarga"
import { exportarPresupuestoPdf } from "@/server/reportes/reportes.actions"
import type { FiltrosPresupuesto, Moneda } from "@/types/presupuesto.types"

// Genera el reporte gerencial de presupuesto en PDF con la moneda y filtros
// activos del dashboard (el servidor recomputa la vista con esos parámetros).
export const PresupuestoExportarPdf = ({
  moneda,
  filtros,
}: {
  moneda: Moneda
  filtros: FiltrosPresupuesto
}) => {
  const [pending, startTransition] = useTransition()

  const onExportar = () =>
    startTransition(async () => {
      const res = await exportarPresupuestoPdf({ moneda, filtros })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      descargarArchivo(res.base64, res.filename, PDF_MIME)
    })

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={onExportar}
    >
      {pending ? "Generando…" : "Descargar PDF"}
    </Button>
  )
}
