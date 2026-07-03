"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { XLSX_MIME } from "@/constants/export.constants"
import { descargarArchivo } from "@/lib/descarga"
import { exportarEstimacionExcel } from "@/server/estimaciones/estimaciones.actions"

// Genera el Excel en el servidor y lo descarga (base64 → Blob) en el cliente.
export const EstimacionExportar = ({ id }: { id: string }) => {
  const [pending, startTransition] = useTransition()

  const onExportar = () =>
    startTransition(async () => {
      const res = await exportarEstimacionExcel({ id })
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
      {pending ? "Exportando…" : "Exportar Excel"}
    </Button>
  )
}
