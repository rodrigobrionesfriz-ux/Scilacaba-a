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
import { eliminarPano } from "@/server/panos/panos.actions"
import type { PanoRow } from "@/types/panos.types"

export const PanoDelete = ({ pano }: { pano: PanoRow }) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const onConfirm = () =>
    startTransition(async () => {
      const res = await eliminarPano(pano.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Paño eliminado")
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
          <AlertDialogTitle>Eliminar {pano.nombre}</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. ¿Eliminar el paño “{pano.nombre}”?
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
