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
import {
  METODOS_APLICACION,
  TIPOS_PRODUCTO,
  UNIDADES_DOSIS,
} from "@/constants/cuaderno.constants"
import { aplicacionSchema } from "@/schemas/aplicaciones.schema"
import {
  crearAplicacion,
  editarAplicacion,
} from "@/server/aplicaciones/aplicaciones.actions"
import type { AplicacionRow } from "@/types/aplicaciones.types"

type Opcion = { value: string; label: string }

type AplicacionFormProps = {
  aplicacion?: AplicacionRow
  panos: Opcion[]
  productos: string[]
}

const estadoInicial = (a?: AplicacionRow) => ({
  fecha: a?.fecha ?? "",
  panoId: a?.panoId == null ? "" : String(a.panoId),
  tipo: a?.tipo ?? "",
  producto: a?.producto ?? "",
  dosis: a?.dosis ?? "",
  unidad: a?.unidad || "L/ha",
  metodo: a?.metodo ?? "",
  operador: a?.operador ?? "",
  obs: a?.obs ?? "",
  lote: a?.lote ?? "",
})

export const AplicacionForm = ({
  aplicacion,
  panos,
  productos,
}: AplicacionFormProps) => {
  const router = useRouter()
  const esEdicion = Boolean(aplicacion)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(estadoInicial(aplicacion))

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const tipoItems = TIPOS_PRODUCTO.map((t) => ({ value: t, label: t }))
  const unidadItems = UNIDADES_DOSIS.map((u) => ({ value: u, label: u }))
  const metodoItems = METODOS_APLICACION.map((m) => ({ value: m, label: m }))

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsed = aplicacionSchema.safeParse(form)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = aplicacion
        ? await editarAplicacion(aplicacion.id, parsed.data)
        : await crearAplicacion(parsed.data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(esEdicion ? "Aplicación actualizada" : "Aplicación creada")
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
            <Button size="sm">Nueva aplicación</Button>
          )
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? "Editar aplicación" : "Nueva aplicación"}
          </DialogTitle>
          <DialogDescription>
            Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={form.fecha}
                onChange={(e) => set("fecha", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Paño *</Label>
              <Select
                items={panos}
                value={form.panoId}
                onValueChange={(v) => set("panoId", v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {panos.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Tipo *</Label>
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
              <Label htmlFor="lote">N° lote</Label>
              <Input
                id="lote"
                value={form.lote}
                onChange={(e) => set("lote", e.target.value)}
                placeholder="Ej: CAP-2024-001"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="producto">Producto *</Label>
            <Input
              id="producto"
              list="cuaderno-catalogo"
              value={form.producto}
              onChange={(e) => set("producto", e.target.value)}
              placeholder="Buscar en catálogo…"
              required
            />
            <datalist id="cuaderno-catalogo">
              {productos.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dosis">Dosis</Label>
              <Input
                id="dosis"
                value={form.dosis}
                onChange={(e) => set("dosis", e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Unidad</Label>
              <Select
                items={unidadItems}
                value={form.unidad}
                onValueChange={(v) => set("unidad", v ?? "L/ha")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES_DOSIS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Método *</Label>
              <Select
                items={metodoItems}
                value={form.metodo}
                onValueChange={(v) => set("metodo", v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {METODOS_APLICACION.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="operador">Operador</Label>
              <Input
                id="operador"
                value={form.operador}
                onChange={(e) => set("operador", e.target.value)}
                placeholder="Nombre del aplicador"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="obs">Observaciones</Label>
              <Input
                id="obs"
                value={form.obs}
                onChange={(e) => set("obs", e.target.value)}
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
