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
import { ALCANCES } from "@/constants/tomas.constants"
import type { Bodega } from "@/schemas/bodegas.schema"
import { iniciarTomaSchema } from "@/schemas/tomas.schema"
import { iniciarToma } from "@/server/tomas/tomas.actions"

type TomaIniciarProps = {
  bodegas: Bodega[]
  grupos: string[]
  tipos: string[]
}

// Sentinel para "sin filtro" (shadcn Select no admite value vacío).
const TODOS = "__todos"

const estadoInicial = {
  bodegaId: "",
  filtroGrupo: TODOS,
  filtroTipo: TODOS,
  alcance: "conStock",
  observaciones: "",
}

export const TomaIniciar = ({ bodegas, grupos, tipos }: TomaIniciarProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(estadoInicial)

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const bodegaItems = bodegas.map((b) => ({ value: b.id, label: b.nombre }))
  const grupoItems = [
    { value: TODOS, label: "Todos" },
    ...grupos.map((g) => ({ value: g, label: g })),
  ]
  const tipoItems = [
    { value: TODOS, label: "Todos" },
    ...tipos.map((t) => ({ value: t, label: t })),
  ]

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsed = iniciarTomaSchema.safeParse({
      ...form,
      filtroGrupo: form.filtroGrupo === TODOS ? "" : form.filtroGrupo,
      filtroTipo: form.filtroTipo === TODOS ? "" : form.filtroTipo,
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = await iniciarToma(parsed.data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Toma iniciada")
      setOpen(false)
      setForm(estadoInicial)
      router.push(`/tomas/${res.id}`)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Iniciar toma</Button>} />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Iniciar toma de inventario</DialogTitle>
          <DialogDescription>
            Se genera la lista de productos a contar según la bodega y el alcance.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Bodega *</Label>
            <Select
              items={bodegaItems}
              value={form.bodegaId}
              onValueChange={(v) => set("bodegaId", v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona…" />
              </SelectTrigger>
              <SelectContent>
                {bodegas.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Alcance *</Label>
            <Select
              items={ALCANCES}
              value={form.alcance}
              onValueChange={(v) => set("alcance", v ?? "conStock")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALCANCES.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Grupo</Label>
              <Select
                items={grupoItems}
                value={form.filtroGrupo}
                onValueChange={(v) => set("filtroGrupo", v ?? TODOS)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {grupoItems.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tipo</Label>
              <Select
                items={tipoItems}
                value={form.filtroTipo}
                onValueChange={(v) => set("filtroTipo", v ?? TODOS)}
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
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Input
              id="observaciones"
              value={form.observaciones}
              onChange={(e) => set("observaciones", e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Generando…" : "Iniciar toma"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
