"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BODEGA_ID_MAX } from "@/constants/bodegas.constants"
import { type Bodega, bodegaSchema } from "@/schemas/bodegas.schema"
import { crearBodega, editarBodega } from "@/server/bodegas/bodegas.actions"

const estadoInicial = (b?: Bodega) => ({
  id: b?.id ?? "",
  nombre: b?.nombre ?? "",
  direccion: b?.direccion ?? "",
  esServicios: b?.esServicios ?? false,
  activo: b?.activo ?? true,
})

export const BodegaForm = ({ bodega }: { bodega?: Bodega }) => {
  const router = useRouter()
  const esEdicion = Boolean(bodega)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(estadoInicial(bodega))

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsed = bodegaSchema.safeParse(form)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = bodega
        ? await editarBodega(bodega.id, parsed.data)
        : await crearBodega(parsed.data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(esEdicion ? "Bodega actualizada" : "Bodega creada")
      setOpen(false)
      if (!esEdicion) setForm(estadoInicial())
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
            <Button size="sm">Nueva bodega</Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? `Editar ${bodega?.id}` : "Nueva bodega"}
          </DialogTitle>
          <DialogDescription>
            Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="id">ID *</Label>
            <Input
              id="id"
              value={form.id}
              onChange={(e) => set("id", e.target.value)}
              maxLength={BODEGA_ID_MAX}
              disabled={esEdicion}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              value={form.direccion}
              onChange={(e) => set("direccion", e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.esServicios}
                onCheckedChange={(c) => set("esServicios", c)}
              />
              Bodega de servicios
            </label>
            {esEdicion && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.activo}
                  onCheckedChange={(c) => set("activo", c)}
                />
                Activa
              </label>
            )}
          </div>
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
