"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { XLSX_MIME } from "@/constants/export.constants"
import { descargarArchivo } from "@/lib/descarga"
import type { ExportResult } from "@/types/export.types"

type ExportarExcelProps = {
  action: () => Promise<ExportResult>
  label?: string
}

// Botón genérico que dispara un export Excel en el servidor y descarga el
// archivo (base64 → Blob) en el cliente. Reusado por todas las entidades.
export const ExportarExcel = ({
  action,
  label = "Exportar Excel",
}: ExportarExcelProps) => {
  const [pending, startTransition] = useTransition()

  const onExportar = () =>
    startTransition(async () => {
      const res = await action()
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      descargarArchivo(res.base64, res.filename, XLSX_MIME)
    })

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={onExportar}
    >
      {pending ? "Exportando…" : label}
    </Button>
  )
}
