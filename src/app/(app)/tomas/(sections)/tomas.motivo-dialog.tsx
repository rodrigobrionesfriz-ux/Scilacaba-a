"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ActionResult } from "@/types/action.types"

type TomaMotivoDialogProps = {
  titulo: string
  descripcion: string
  etiquetaBoton: string
  variant: "outline" | "destructive"
  disabled: boolean
  onConfirm: (motivo: string) => Promise<ActionResult>
  onDone: () => void
}

// Diálogo con motivo obligatorio, reutilizado por Devolver y Rechazar.
export const TomaMotivoDialog = ({
  titulo,
  descripcion,
  etiquetaBoton,
  variant,
  disabled,
  onConfirm,
  onDone,
}: TomaMotivoDialogProps) => {
  const [open, setOpen] = useState(false)
  const [motivo, setMotivo] = useState("")
  const [enviando, startTransition] = useTransition()

  const confirmar = () => {
    if (motivo.trim() === "") {
      toast.error("Indica el motivo")
      return
    }
    startTransition(async () => {
      const res = await onConfirm(motivo.trim())
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Listo")
      setOpen(false)
      onDone()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={variant} size="sm" disabled={disabled}>
            {etiquetaBoton}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="motivo">Motivo *</Label>
          <Textarea
            id="motivo"
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={confirmar}
            disabled={enviando}
          >
            {enviando ? "Enviando…" : etiquetaBoton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
