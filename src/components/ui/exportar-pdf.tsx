"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PDF_MIME } from "@/constants/export.constants"
import { descargarArchivo } from "@/lib/descarga"
import type { ExportResult } from "@/types/export.types"

type ExportarPdfProps = {
  action: () => Promise<ExportResult>
  label?: string
}

// Botón genérico que genera un reporte PDF en el servidor (react-pdf) y lo
// descarga (base64 → Blob) en el cliente. Reusado por los reportes sin
// parámetros; los que requieren estado usan su propia variante.
export const ExportarPdf = ({
  action,
  label = "Descargar PDF",
}: ExportarPdfProps) => {
  const [pending, startTransition] = useTransition()

  const onExportar = () =>
    startTransition(async () => {
      const res = await action()
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
      {pending ? "Generando…" : label}
    </Button>
  )
}
