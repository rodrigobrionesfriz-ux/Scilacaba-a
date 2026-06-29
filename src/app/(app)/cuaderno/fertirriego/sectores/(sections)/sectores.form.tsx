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
import { sectorSchema } from "@/schemas/sectores.schema"
import { crearSector, editarSector } from "@/server/sectores/sectores.actions"
import type { SectorRow } from "@/types/fertirriego.types"

const estadoInicial = (s?: SectorRow) => ({
  nombre: s?.nombre ?? "",
  equipo: s?.equipo ?? "",
  ha: s?.ha == null ? "" : String(s.ha),
  variedad: s?.variedad ?? "",
  plantas: s?.plantas == null ? "" : String(s.plantas),
})

export const SectorForm = ({ sector }: { sector?: SectorRow }) => {
  const router = useRouter()
  const esEdicion = Boolean(sector)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(estadoInicial(sector))

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsed = sectorSchema.safeParse({
      ...form,
      ha: form.ha === "" ? null : form.ha,
      plantas: form.plantas === "" ? null : form.plantas,
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = sector
        ? await editarSector(sector.id, parsed.data)
        : await crearSector(parsed.data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(esEdicion ? "Sector actualizado" : "Sector creado")
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
            <Button size="sm">Nuevo sector</Button>
          )
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? `Editar ${sector?.nombre}` : "Nuevo sector"}
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
              <Label htmlFor="equipo">Equipo</Label>
              <Input
                id="equipo"
                value={form.equipo}
                onChange={(e) => set("equipo", e.target.value)}
                placeholder="Ej: EQ 1"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ha">Há de riego</Label>
              <Input
                id="ha"
                type="number"
                min={0}
                step="0.01"
                value={form.ha}
                onChange={(e) => set("ha", e.target.value)}
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
