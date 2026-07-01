"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { exportarEstimacionExcel } from "@/server/estimaciones/estimaciones.actions"

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

const descargarBase64 = (base64: string, filename: string) => {
  const binario = atob(base64)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i)
  const url = URL.createObjectURL(new Blob([bytes], { type: XLSX_MIME }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

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
      descargarBase64(res.base64, res.filename)
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
