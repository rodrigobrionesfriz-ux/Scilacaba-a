"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { tipoSchema } from "@/schemas/config.schema"
import { crearTipo, editarTipo } from "@/server/config/config.actions"
import type { TipoRow } from "@/types/config.types"

export const TipoForm = ({ tipo }: { tipo?: TipoRow }) => {
  const router = useRouter()
  const esEdicion = Boolean(tipo)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [nombre, setNombre] = useState(tipo?.nombre ?? "")
  const [descripcion, setDescripcion] = useState(tipo?.descripcion ?? "")
  const [activo, setActivo] = useState(tipo?.activo ?? true)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsed = tipoSchema.safeParse({ nombre, descripcion, activo })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = tipo
        ? await editarTipo(tipo.nombre, parsed.data)
        : await crearTipo(parsed.data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(esEdicion ? "Tipo actualizado" : "Tipo creado")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          esEdicion ? (
            <Button variant="outline" size="sm">
              Editar
            </Button>
          ) : (
            <Button size="sm">Nuevo tipo</Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? `Editar ${tipo?.nombre}` : "Nuevo tipo de producto"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tipoNombre">Nombre *</Label>
            <Input
              id="tipoNombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={esEdicion}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tipoDesc">Descripción</Label>
            <Input
              id="tipoDesc"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={activo}
              onCheckedChange={(c) => setActivo(c === true)}
            />
            Activo
          </label>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
