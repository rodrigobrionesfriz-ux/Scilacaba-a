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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TIPOS_PRODUCTO } from "@/constants/cuaderno.constants"
import { productoCuadernoSchema } from "@/schemas/productos-cuaderno.schema"
import {
  crearProductoCuaderno,
  editarProductoCuaderno,
} from "@/server/productos-cuaderno/productos-cuaderno.actions"
import type { ProductoCuadernoRow } from "@/types/productos-cuaderno.types"

const estadoInicial = (p?: ProductoCuadernoRow) => ({
  nombre: p?.nombre ?? "",
  tipo: p?.tipo ?? "",
  unidad: p?.unidad ?? "",
  dosis: p?.dosis ?? "",
  ingredienteActivo: p?.ingredienteActivo ?? "",
  objetivo: p?.objetivo ?? "",
})

export const ProductoCuadernoForm = ({
  producto,
}: {
  producto?: ProductoCuadernoRow
}) => {
  const router = useRouter()
  const esEdicion = Boolean(producto)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(estadoInicial(producto))

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const tipoItems = TIPOS_PRODUCTO.map((t) => ({ value: t, label: t }))

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsed = productoCuadernoSchema.safeParse(form)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = producto
        ? await editarProductoCuaderno(producto.nombre, parsed.data)
        : await crearProductoCuaderno(parsed.data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(esEdicion ? "Producto actualizado" : "Producto creado")
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
            <Button size="sm">Nuevo producto</Button>
          )
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? `Editar ${producto?.nombre}` : "Nuevo producto"}
          </DialogTitle>
          <DialogDescription>
            Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              disabled={esEdicion}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Tipo</Label>
              <Select
                items={tipoItems}
                value={form.tipo}
                onValueChange={(v) => set("tipo", v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PRODUCTO.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ingredienteActivo">Ingrediente activo</Label>
              <Input
                id="ingredienteActivo"
                value={form.ingredienteActivo}
                onChange={(e) => set("ingredienteActivo", e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="objetivo">Objetivo</Label>
            <Input
              id="objetivo"
              value={form.objetivo}
              onChange={(e) => set("objetivo", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dosis">Dosis</Label>
              <Input
                id="dosis"
                value={form.dosis}
                onChange={(e) => set("dosis", e.target.value)}
                placeholder="Ej: 2.5"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="unidad">Unidad</Label>
              <Input
                id="unidad"
                value={form.unidad}
                onChange={(e) => set("unidad", e.target.value)}
                placeholder="Ej: L/ha"
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
