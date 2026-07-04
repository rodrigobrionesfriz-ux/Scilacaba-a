"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { JSON_MIME } from "@/constants/export.constants"
import { descargarArchivo } from "@/lib/descarga"
import { exportarBackupJson } from "@/server/backup/backup.actions"

export const BackupSection = () => {
  const [pending, startTransition] = useTransition()

  const onDescargar = () =>
    startTransition(async () => {
      const res = await exportarBackupJson()
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      descargarArchivo(res.base64, res.filename, JSON_MIME)
      toast.success("Respaldo descargado")
    })

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Respaldo de datos</CardTitle>
        <CardDescription>
          Descarga un respaldo JSON de todas las tablas de dominio. La
          restauración se realiza a nivel de base de datos (pg_dump / Railway).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onDescargar} disabled={pending}>
          {pending ? "Generando…" : "Descargar respaldo JSON"}
        </Button>
      </CardContent>
    </Card>
  )
}
