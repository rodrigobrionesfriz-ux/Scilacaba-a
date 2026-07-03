"use client"

import { useRef, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { importarPresupuestoExcel } from "@/server/presupuesto/presupuesto.actions"

// Lee un File como base64 (sin el prefijo data:) para enviarlo a la Server Action.
const aBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const res = reader.result
      resolve(typeof res === "string" ? res.split(",")[1] ?? "" : "")
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

// Sube un .xlsx (hoja "Base") que REEMPLAZA todo el dataset de presupuesto.
export const PresupuestoImport = () => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()

  const onArchivo = (file: File | undefined) => {
    if (!file) return
    startTransition(async () => {
      const base64 = await aBase64(file)
      const res = await importarPresupuestoExcel(base64)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(
        `${res.insertadas} registros · ${res.mesesConReal} meses con datos reales`,
      )
    })
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(e) => {
          onArchivo(e.target.files?.[0])
          e.target.value = ""
        }}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? "Importando…" : "Actualizar datos (Excel)"}
      </Button>
    </div>
  )
}
