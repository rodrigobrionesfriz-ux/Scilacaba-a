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
import { Textarea } from "@/components/ui/textarea"
import {
  type CentroCosto,
  centroCostoSchema,
} from "@/schemas/centros-costo.schema"
import {
  crearCentroCosto,
  editarCentroCosto,
} from "@/server/centros-costo/centros-costo.actions"

const estadoInicial = (c?: CentroCosto): CentroCosto => ({
  codigo: c?.codigo ?? "",
  descripcion: c?.descripcion ?? "",
  area: c?.area ?? "",
  responsable: c?.responsable ?? "",
  observaciones: c?.observaciones ?? "",
  activo: c?.activo ?? true,
})

type CentroCostoFormProps = { centro?: CentroCosto; areas: string[] }

export const CentroCostoForm = ({ centro, areas }: CentroCostoFormProps) => {
  const router = useRouter()
  const esEdicion = Boolean(centro)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(estadoInicial(centro))

  const set = <K extends keyof CentroCosto>(key: K, value: CentroCosto[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsed = centroCostoSchema.safeParse(form)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = centro
        ? await editarCentroCosto(centro.codigo, parsed.data)
        : await crearCentroCosto(parsed.data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(esEdicion ? "Centro de costo actualizado" : "Centro de costo creado")
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
            <Button size="sm">Nuevo centro de costo</Button>
          )
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? `Editar ${centro?.codigo}` : "Nuevo centro de costo"}
          </DialogTitle>
          <DialogDescription>
            Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={form.codigo}
                onChange={(e) =>
                  set("codigo", e.target.value.toUpperCase().replace(/\s+/g, "-"))
                }
                disabled={esEdicion}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="area">Área *</Label>
              <Input
                id="area"
                list="areas-cc"
                value={form.area}
                onChange={(e) => set("area", e.target.value.toUpperCase())}
                required
              />
              <datalist id="areas-cc">
                {areas.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Input
              id="descripcion"
              value={form.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="responsable">Responsable</Label>
            <Input
              id="responsable"
              value={form.responsable}
              onChange={(e) => set("responsable", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={form.observaciones}
              onChange={(e) => set("observaciones", e.target.value)}
            />
          </div>
          {esEdicion && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.activo}
                onCheckedChange={(c) => set("activo", c)}
              />
              Activo
            </label>
          )}
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
