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
import { eliminarFactura } from "@/server/mantenciones/mantenciones.actions"
import type { MantencionDetalle } from "@/types/mantenciones.types"

export const FacturaDelete = ({ orden }: { orden: MantencionDetalle }) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const onConfirm = () =>
    startTransition(async () => {
      const res = await eliminarFactura({ id: orden.id })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Factura eliminada")
      setOpen(false)
      router.refresh()
    })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="sm">
            Quitar factura
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Quitar factura de {orden.numero}</AlertDialogTitle>
          <AlertDialogDescription>
            Se revertirá el movimiento de inventario asociado y la OT volverá a
            estado Abierta. ¿Continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Quitando…" : "Quitar factura"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
