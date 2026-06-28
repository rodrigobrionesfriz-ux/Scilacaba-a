"use client"

import { useRouter } from "next/navigation"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { COLORES_PANO } from "@/constants/cuaderno.constants"
import { cn } from "@/lib/utils"
import { panoSchema } from "@/schemas/panos.schema"
import { crearPano, editarPano } from "@/server/panos/panos.actions"
import type { PanoRow } from "@/types/panos.types"

const estadoInicial = (p?: PanoRow) => ({
  nombre: p?.nombre ?? "",
  variedad: p?.variedad ?? "",
  anio: p?.anio ?? "",
  hectareas: p?.hectareas == null ? "" : String(p.hectareas),
  hasRiego: p?.hasRiego == null ? "" : String(p.hasRiego),
  densidad: p?.densidad == null ? "" : String(p.densidad),
  plantas: p?.plantas == null ? "" : String(p.plantas),
  color: p?.color ?? "",
})

export const PanoForm = ({ pano }: { pano?: PanoRow }) => {
  const router = useRouter()
  const esEdicion = Boolean(pano)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(estadoInicial(pano))

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsed = panoSchema.safeParse({
      ...form,
      hectareas: form.hectareas === "" ? null : form.hectareas,
      hasRiego: form.hasRiego === "" ? null : form.hasRiego,
      densidad: form.densidad === "" ? null : form.densidad,
      plantas: form.plantas === "" ? null : form.plantas,
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = pano
        ? await editarPano(pano.id, parsed.data)
        : await crearPano(parsed.data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(esEdicion ? "Paño actualizado" : "Paño creado")
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
            <Button size="sm">Nuevo paño</Button>
          )
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? `Editar ${pano?.nombre}` : "Nuevo paño"}
          </DialogTitle>
          <DialogDescription>
            Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
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
              <Label htmlFor="variedad">Variedad</Label>
              <Input
                id="variedad"
                value={form.variedad}
                onChange={(e) => set("variedad", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="anio">Año plantación</Label>
              <Input
                id="anio"
                value={form.anio}
                onChange={(e) => set("anio", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="plantas">N° plantas</Label>
              <Input
                id="plantas"
                type="number"
                min={0}
                step={1}
                value={form.plantas}
                onChange={(e) => set("plantas", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="hectareas">Há plantadas</Label>
              <Input
                id="hectareas"
                type="number"
                min={0}
                step="0.01"
                value={form.hectareas}
                onChange={(e) => set("hectareas", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="hasRiego">Há riego</Label>
              <Input
                id="hasRiego"
                type="number"
                min={0}
                step="0.01"
                value={form.hasRiego}
                onChange={(e) => set("hasRiego", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="densidad">Densidad</Label>
              <Input
                id="densidad"
                type="number"
                min={0}
                step="0.01"
                value={form.densidad}
                onChange={(e) => set("densidad", e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORES_PANO.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("color", form.color === c ? "" : c)}
                  className={cn(
                    "size-7 rounded-full border-2 transition-transform",
                    form.color === c
                      ? "scale-110 border-foreground"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
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
