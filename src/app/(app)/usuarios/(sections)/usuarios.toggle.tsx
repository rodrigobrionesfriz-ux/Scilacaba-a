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
import { toggleActivo } from "@/server/usuarios/usuarios.actions"

type ToggleActivoProps = {
  id: string
  activo: boolean
}

export const ToggleActivo = ({ id, activo }: ToggleActivoProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const onConfirm = () =>
    startTransition(async () => {
      const res = await toggleActivo(id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(activo ? "Usuario desactivado" : "Usuario activado")
      setOpen(false)
      router.refresh()
    })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="sm">
            {activo ? "Desactivar" : "Activar"}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {activo ? "Desactivar usuario" : "Activar usuario"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {activo
              ? "El usuario no podrá iniciar sesión hasta reactivarlo."
              : "El usuario podrá volver a iniciar sesión."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={pending}>
            {pending ? "Aplicando…" : "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
