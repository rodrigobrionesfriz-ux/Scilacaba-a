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
import { confirmacionSchema } from "@/schemas/confirmaciones.schema"
import { crearConfirmacion } from "@/server/confirmaciones/confirmaciones.actions"
import type { OrdenRow } from "@/types/ordenes.types"
import { recalcularProductosReales } from "@/utils/ordenes.utils"

const fmt = (n: number, d = 3) =>
  n.toLocaleString("es-CL", { maximumFractionDigits: d })

const estadoInicial = (orden: OrdenRow) => ({
  fechaApp: "",
  operador: "",
  equipo: "",
  horaInicio: "",
  horaFin: "",
  aguaReal: orden.tAgua > 0 ? String(orden.tAgua) : "",
  tempAmb: "",
  humedad: "",
  viento: "",
  condClima: "",
  notas: "",
})

export const OrdenConfirmar = ({ orden }: { orden: OrdenRow }) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(estadoInicial(orden))
  const [panoIds, setPanoIds] = useState<string[]>(orden.panoIds)

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  // Cantidades reales recalculadas por proporción de agua (misma util que la action).
  const reales = recalcularProductosReales(
    orden.productos,
    orden.tAgua,
    Number(form.aguaReal) || 0,
  )

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsed = confirmacionSchema.safeParse({
      ...form,
      ordenId: orden.id,
      panoIds,
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = await crearConfirmacion(parsed.data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Aplicación confirmada")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            Confirmar
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Confirmar {orden.numero}</DialogTitle>
          <DialogDescription>
            Registra la aplicación realizada. Las cantidades reales se recalculan
            según el agua aplicada.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cf-fecha">Fecha de aplicación *</Label>
              <Input
                id="cf-fecha"
                type="date"
                value={form.fechaApp}
                onChange={(e) => set("fechaApp", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cf-op">Operador *</Label>
              <Input
                id="cf-op"
                value={form.operador}
                onChange={(e) => set("operador", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cf-agua">Agua real (L)</Label>
              <Input
                id="cf-agua"
                inputMode="decimal"
                value={form.aguaReal}
                onChange={(e) => set("aguaReal", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cf-eq">Equipo</Label>
              <Input
                id="cf-eq"
                value={form.equipo}
                onChange={(e) => set("equipo", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cf-hi">Hora inicio</Label>
              <Input
                id="cf-hi"
                type="time"
                value={form.horaInicio}
                onChange={(e) => set("horaInicio", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cf-hf">Hora fin</Label>
              <Input
                id="cf-hf"
                type="time"
                value={form.horaFin}
                onChange={(e) => set("horaFin", e.target.value)}
              />
            </div>
          </div>

          <fieldset className="flex flex-col gap-2 rounded-md border p-3">
            <legend className="px-1 text-sm font-medium">Paños aplicados *</legend>
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
              {orden.distribucion.map((d) => (
                <label key={d.panoId} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={panoIds.includes(d.panoId)}
                    onCheckedChange={() =>
                      setPanoIds((prev) =>
                        prev.includes(d.panoId)
                          ? prev.filter((x) => x !== d.panoId)
                          : [...prev, d.panoId],
                      )
                    }
                  />
                  <span className="truncate">{d.panoNombre}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {reales.length > 0 && (
            <div className="rounded-md border p-3 text-sm">
              <p className="mb-1 font-medium">Cantidades reales estimadas</p>
              <ul className="list-inside list-disc">
                {reales.map((p) => (
                  <li key={p.nombre}>
                    {p.nombre}: {fmt(p.qtyAplicada)} {p.unitS}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cf-temp">Temp. (°C)</Label>
              <Input
                id="cf-temp"
                inputMode="decimal"
                value={form.tempAmb}
                onChange={(e) => set("tempAmb", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cf-hum">Humedad (%)</Label>
              <Input
                id="cf-hum"
                inputMode="decimal"
                value={form.humedad}
                onChange={(e) => set("humedad", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cf-viento">Viento (km/h)</Label>
              <Input
                id="cf-viento"
                inputMode="decimal"
                value={form.viento}
                onChange={(e) => set("viento", e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cf-notas">Notas</Label>
            <Textarea
              id="cf-notas"
              value={form.notas}
              onChange={(e) => set("notas", e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Confirmando…" : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
