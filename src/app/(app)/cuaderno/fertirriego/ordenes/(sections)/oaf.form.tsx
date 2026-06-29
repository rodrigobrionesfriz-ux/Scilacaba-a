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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { oafSchema } from "@/schemas/oaf.schema"
import { crearOaf, editarOaf } from "@/server/oaf/oaf.actions"
import type {
  Aportes,
  ConfigFert,
  OafRow,
  ProductoFertRow,
  SectorRow,
} from "@/types/fertirriego.types"
import { calcularAportes } from "@/utils/fertirriego.utils"

type OafFormProps = {
  orden?: OafRow
  sectores: SectorRow[]
  productos: ProductoFertRow[]
  config: ConfigFert
}

type LineaFila = { prod: string; dosis: string; unidad: string; obs: string }

const fmt = (n: number, d = 2) =>
  n.toLocaleString("es-CL", { maximumFractionDigits: d })

const estadoInicial = (o?: OafRow) => ({
  fecha: o?.fecha ?? "",
  forma: o?.forma ?? "",
  horario: o?.horario ?? "",
  estado: o?.estado ?? "",
  responsable: o?.responsable ?? "",
})

const lineasIniciales = (o: OafRow | undefined, unidadDef: string): LineaFila[] =>
  o?.lineas.length
    ? o.lineas.map((l) => ({
        prod: l.prod,
        dosis: String(l.dosis),
        unidad: l.unidad,
        obs: l.obs,
      }))
    : [{ prod: "", dosis: "", unidad: unidadDef, obs: "" }]

export const OafForm = ({ orden, sectores, productos, config }: OafFormProps) => {
  const router = useRouter()
  const esEdicion = Boolean(orden)
  const unidadDef = config.unidades[0] ?? "kg"
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(estadoInicial(orden))
  const [sectoresSel, setSectoresSel] = useState<string[]>(orden?.sectores ?? [])
  const [lineas, setLineas] = useState<LineaFila[]>(
    lineasIniciales(orden, unidadDef),
  )

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const toggleSector = (id: string) =>
    setSectoresSel((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )

  const setLinea = (i: number, key: keyof LineaFila, value: string) =>
    setLineas((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)),
    )

  // Preview de aporte nutricional en vivo (misma util pura que usa la vista).
  const aportesPorProducto = new Map<string, Aportes>(
    productos.map((p) => [p.nombre, p.aportes]),
  )
  const haTotal = sectoresSel.reduce((acc, id) => {
    const s = sectores.find((x) => x.id === id)
    return acc + (s?.ha ?? 0)
  }, 0)
  const lineasValidas = lineas
    .filter((l) => l.prod.trim() && Number(l.dosis) > 0)
    .map((l) => ({
      prod: l.prod.trim(),
      dosis: Number(l.dosis),
      unidad: l.unidad,
      obs: l.obs,
    }))
  const aportes = calcularAportes(lineasValidas, aportesPorProducto, haTotal)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsed = oafSchema.safeParse({
      ...form,
      sectores: sectoresSel,
      lineas: lineas.filter((l) => l.prod.trim() !== "" || l.dosis.trim() !== ""),
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = orden
        ? await editarOaf(orden.id, parsed.data)
        : await crearOaf(parsed.data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(esEdicion ? "Orden actualizada" : "Orden creada")
      setOpen(false)
      router.refresh()
    })
  }

  const lista = (xs: readonly string[]) => xs.map((x) => ({ value: x, label: x }))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          esEdicion ? (
            <Button variant="outline" size="sm">
              Editar
            </Button>
          ) : (
            <Button size="sm">Nueva orden</Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? `Editar ${orden?.numero}` : "Nueva orden de fertirriego"}
          </DialogTitle>
          <DialogDescription>
            Selecciona sectores y productos. El aporte nutricional se calcula
            automáticamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
              <Label>Forma</Label>
              <Select
                items={lista(config.formas)}
                value={form.forma}
                onValueChange={(v) => set("forma", v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {config.formas.map((x) => (
                    <SelectItem key={x} value={x}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Horario</Label>
              <Select
                items={lista(config.horarios)}
                value={form.horario}
                onValueChange={(v) => set("horario", v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {config.horarios.map((x) => (
                    <SelectItem key={x} value={x}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Estado fenológico</Label>
              <Select
                items={lista(config.estados)}
                value={form.estado}
                onValueChange={(v) => set("estado", v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {config.estados.map((x) => (
                    <SelectItem key={x} value={x}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="responsable">Responsable</Label>
              <Input
                id="responsable"
                value={form.responsable}
                onChange={(e) => set("responsable", e.target.value)}
              />
            </div>
          </div>

          {/* Sectores */}
          <fieldset className="flex flex-col gap-2 rounded-md border p-3">
            <legend className="px-1 text-sm font-medium">
              Sectores * · {fmt(haTotal)} há
            </legend>
            <div className="grid max-h-40 grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3">
              {sectores.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={sectoresSel.includes(s.id)}
                    onCheckedChange={() => toggleSector(s.id)}
                  />
                  <span className="truncate">
                    {s.nombre}
                    {s.ha != null ? ` · ${fmt(s.ha)} ha` : ""}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Productos (líneas) */}
          <fieldset className="flex flex-col gap-2 rounded-md border p-3">
            <legend className="px-1 text-sm font-medium">Productos *</legend>
            {lineas.map((l, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-2"
              >
                <Input
                  list="fertirriego-catalogo"
                  value={l.prod}
                  onChange={(e) => setLinea(i, "prod", e.target.value)}
                  placeholder="Producto…"
                />
                <Input
                  className="w-24"
                  inputMode="decimal"
                  value={l.dosis}
                  onChange={(e) => setLinea(i, "dosis", e.target.value)}
                  placeholder="Dosis"
                />
                <Select
                  items={lista(config.unidades)}
                  value={l.unidad}
                  onValueChange={(v) => setLinea(i, "unidad", v ?? unidadDef)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {config.unidades.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={lineas.length <= 1}
                  onClick={() =>
                    setLineas((prev) => prev.filter((_, idx) => idx !== i))
                  }
                >
                  ✕
                </Button>
              </div>
            ))}
            <datalist id="fertirriego-catalogo">
              {productos.map((p) => (
                <option key={p.nombre} value={p.nombre} />
              ))}
            </datalist>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() =>
                setLineas((prev) => [
                  ...prev,
                  { prod: "", dosis: "", unidad: unidadDef, obs: "" },
                ])
              }
            >
              + Añadir producto
            </Button>
          </fieldset>

          {/* Preview de aporte nutricional */}
          {aportes.length > 0 && (
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="mb-2 text-sm font-medium">
                Aporte nutricional estimado · {fmt(haTotal)} há
              </p>
              <div className="flex flex-wrap gap-2">
                {aportes.map((a) => (
                  <div
                    key={a.nutriente}
                    className="rounded-md border bg-background px-3 py-1 text-center"
                  >
                    <div className="text-xs font-semibold text-primary">
                      {a.nutriente}
                    </div>
                    <div className="text-sm font-semibold">{fmt(a.kg, 2)}</div>
                    <div className="text-[10px] text-muted-foreground">kg</div>
                  </div>
                ))}
              </div>
            </div>
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
