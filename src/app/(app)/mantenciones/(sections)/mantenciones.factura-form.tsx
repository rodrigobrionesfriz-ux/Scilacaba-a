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
import { Textarea } from "@/components/ui/textarea"
import { TIPOS_DOC_FACTURA } from "@/constants/mantenciones.constants"
import { facturaSchema } from "@/schemas/mantenciones.schema"
import { registrarFactura } from "@/server/mantenciones/mantenciones.actions"
import type { MantencionDetalle } from "@/types/mantenciones.types"

export const FacturaForm = ({ orden }: { orden: MantencionDetalle }) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    tipoDoc: TIPOS_DOC_FACTURA[0],
    numeroDoc: "",
    fecha: "",
    monto: String(orden.total),
    horometro: "",
    obs: "",
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const tipoItems = TIPOS_DOC_FACTURA.map((t) => ({ value: t, label: t }))

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!orden.proveedorCodigo) {
      toast.error("Asigne un proveedor a la OT antes de facturar")
      return
    }
    const parsed = facturaSchema.safeParse({
      otId: orden.id,
      tipoDoc: form.tipoDoc,
      numeroDoc: form.numeroDoc,
      fecha: form.fecha,
      monto: Number(form.monto) || 0,
      horometro: form.horometro.trim() === "" ? null : Number(form.horometro),
      obs: form.obs,
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = await registrarFactura(parsed.data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Factura registrada")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            Facturar
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar factura · {orden.numero}</DialogTitle>
          <DialogDescription>
            Genera un movimiento de entrada en la bodega de servicios por el monto
            neto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Tipo de documento *</Label>
              <Select
                items={tipoItems}
                value={form.tipoDoc}
                onValueChange={(v) => set("tipoDoc", v ?? TIPOS_DOC_FACTURA[0])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tipoItems.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="numeroDoc">N° documento *</Label>
              <Input
                id="numeroDoc"
                value={form.numeroDoc}
                onChange={(e) => set("numeroDoc", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fecha-fact">Fecha *</Label>
              <Input
                id="fecha-fact"
                type="date"
                value={form.fecha}
                onChange={(e) => set("fecha", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="monto">Monto neto *</Label>
              <Input
                id="monto"
                inputMode="decimal"
                value={form.monto}
                onChange={(e) => set("monto", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="horometro">Horómetro (hrs)</Label>
              <Input
                id="horometro"
                inputMode="decimal"
                value={form.horometro}
                onChange={(e) => set("horometro", e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="obs">Observación</Label>
            <Textarea
              id="obs"
              value={form.obs}
              onChange={(e) => set("obs", e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Registrando…" : "Registrar factura"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
