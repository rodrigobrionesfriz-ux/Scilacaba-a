"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { eliminarAplicacion } from "@/server/aplicaciones/aplicaciones.actions"
import type { AplicacionRow } from "@/types/aplicaciones.types"

export const AplicacionDelete = ({
  aplicacion,
}: {
  aplicacion: AplicacionRow
}) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const onConfirm = () =>
    startTransition(async () => {
      const res = await eliminarAplicacion(aplicacion.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Aplicación eliminada")
      setOpen(false)
      router.refresh()
    })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="sm">
            Eliminar
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar aplicación</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. ¿Eliminar la aplicación de “
            {aplicacion.producto}” del {aplicacion.fecha}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Eliminando…" : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
