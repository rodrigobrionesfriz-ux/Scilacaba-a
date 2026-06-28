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
import { Textarea } from "@/components/ui/textarea"
import {
  ESTADOS_FENOLOGICOS,
  OBJETIVOS_APP,
  TIPOS_APP,
  UNIDADES_ORDEN,
} from "@/constants/cuaderno.constants"
import { ordenSchema } from "@/schemas/ordenes.schema"
import { crearOrden, editarOrden } from "@/server/ordenes/ordenes.actions"
import type { PanoRow } from "@/types/panos.types"
import type { OrdenRow } from "@/types/ordenes.types"
import {
  calcularDistribucion,
  type PanoDistribInput,
  type ProductoInput,
  resolverHas,
} from "@/utils/ordenes.utils"

type OrdenFormProps = {
  orden?: OrdenRow
  panos: PanoRow[]
  catalogo: string[]
}

type ProductoFila = { nombre: string; dosis: string; unidad: string }

const fmt = (n: number, d = 2) =>
  n.toLocaleString("es-CL", { maximumFractionDigits: d })

const estadoInicial = (o?: OrdenRow) => ({
  fecha: o?.fecha ?? "",
  tipoApp: o?.tipoApp ?? "",
  fenologico: o?.fenologico ?? "",
  especie: o?.especie ?? "",
  responsable: o?.responsable ?? "",
  metodo: o?.metodo ?? "",
  objetivoOtro: o?.objetivoOtro ?? "",
  moj: o?.moj == null ? "" : String(o.moj),
  vha: o?.vha == null ? "1" : String(o.vha),
  notas: o?.notas ?? "",
})

const productosIniciales = (o?: OrdenRow): ProductoFila[] =>
  o?.productos.length
    ? o.productos.map((p) => ({
        nombre: p.nombre,
        dosis: String(p.dosis),
        unidad: p.unidad,
      }))
    : [{ nombre: "", dosis: "", unidad: "L/ha" }]

export const OrdenForm = ({ orden, panos, catalogo }: OrdenFormProps) => {
  const router = useRouter()
  const esEdicion = Boolean(orden)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(estadoInicial(orden))
  const [objetivos, setObjetivos] = useState<string[]>(orden?.objetivos ?? [])
  const [panoIds, setPanoIds] = useState<string[]>(orden?.panoIds ?? [])
  const [productos, setProductos] = useState<ProductoFila[]>(
    productosIniciales(orden),
  )

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const toggle = (lista: string[], v: string) =>
    lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]

  const setProducto = (i: number, key: keyof ProductoFila, value: string) =>
    setProductos((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)),
    )

  // Preview de distribución en vivo (misma util pura que usa la action).
  const productosValidos: ProductoInput[] = productos
    .filter((p) => p.nombre.trim() && Number(p.dosis) > 0)
    .map((p) => ({ nombre: p.nombre, dosis: Number(p.dosis), unidad: p.unidad }))
  const panosSel: PanoDistribInput[] = panoIds.flatMap((id) => {
    const p = panos.find((pp) => String(pp.id) === id)
    if (!p) return []
    return [
      {
        id,
        nombre: p.nombre,
        variedad: p.variedad,
        anio: p.anio,
        color: p.color,
        has: resolverHas(
          { hectareas: p.hectareas, hasRiego: p.hasRiego },
          form.tipoApp || "Foliar",
        ),
      },
    ]
  })
  const preview = calcularDistribucion(
    productosValidos,
    panosSel,
    Number(form.moj) || 0,
    Number(form.vha) || 1,
  )

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsed = ordenSchema.safeParse({
      ...form,
      objetivos,
      panoIds,
      productos: productos.filter(
        (p) => p.nombre.trim() !== "" || p.dosis.trim() !== "",
      ),
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = orden
        ? await editarOrden(orden.id, parsed.data)
        : await crearOrden(parsed.data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(esEdicion ? "Orden actualizada" : "Orden creada")
      setOpen(false)
      router.refresh()
    })
  }

  const tipoItems = TIPOS_APP.map((t) => ({ value: t, label: t }))
  const fenoItems = ESTADOS_FENOLOGICOS.map((f) => ({ value: f, label: f }))

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
            {esEdicion ? `Editar ${orden?.numero}` : "Nueva orden de aplicación"}
          </DialogTitle>
          <DialogDescription>
            Los campos marcados con * son obligatorios. La distribución por paño
            se calcula automáticamente.
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
              <Label>Tipo *</Label>
              <Select
                items={tipoItems}
                value={form.tipoApp}
                onValueChange={(v) => set("tipoApp", v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_APP.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Estado fenológico *</Label>
              <Select
                items={fenoItems}
                value={form.fenologico}
                onValueChange={(v) => set("fenologico", v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_FENOLOGICOS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="especie">Especie</Label>
              <Input
                id="especie"
                value={form.especie}
                onChange={(e) => set("especie", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="responsable">Responsable técnico</Label>
              <Input
                id="responsable"
                value={form.responsable}
                onChange={(e) => set("responsable", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="metodo">Método</Label>
              <Input
                id="metodo"
                value={form.metodo}
                onChange={(e) => set("metodo", e.target.value)}
              />
            </div>
          </div>

          {/* Mojamiento */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="moj">Mojamiento (L/ha)</Label>
              <Input
                id="moj"
                inputMode="decimal"
                value={form.moj}
                onChange={(e) => set("moj", e.target.value)}
                placeholder="Ej: 1000"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="vha">Pasadas</Label>
              <Input
                id="vha"
                inputMode="decimal"
                value={form.vha}
                onChange={(e) => set("vha", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Moj. total efectivo</Label>
              <Input value={preview.mojT > 0 ? fmt(preview.mojT, 0) : ""} readOnly />
            </div>
          </div>

          {/* Productos en mezcla */}
          <fieldset className="flex flex-col gap-2 rounded-md border p-3">
            <legend className="px-1 text-sm font-medium">Productos *</legend>
            {productos.map((p, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-2">
                <Input
                  list="cuaderno-catalogo-oa"
                  value={p.nombre}
                  onChange={(e) => setProducto(i, "nombre", e.target.value)}
                  placeholder="Producto del catálogo…"
                />
                <Input
                  className="w-24"
                  inputMode="decimal"
                  value={p.dosis}
                  onChange={(e) => setProducto(i, "dosis", e.target.value)}
                  placeholder="Dosis"
                />
                <Select
                  items={UNIDADES_ORDEN.map((u) => ({ value: u, label: u }))}
                  value={p.unidad}
                  onValueChange={(v) => setProducto(i, "unidad", v ?? "L/ha")}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIDADES_ORDEN.map((u) => (
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
                  disabled={productos.length <= 1}
                  onClick={() =>
                    setProductos((prev) => prev.filter((_, idx) => idx !== i))
                  }
                >
                  ✕
                </Button>
              </div>
            ))}
            <datalist id="cuaderno-catalogo-oa">
              {catalogo.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() =>
                setProductos((prev) => [
                  ...prev,
                  { nombre: "", dosis: "", unidad: "L/ha" },
                ])
              }
            >
              + Añadir producto
            </Button>
          </fieldset>

          {/* Paños objetivo */}
          <fieldset className="flex flex-col gap-2 rounded-md border p-3">
            <legend className="px-1 text-sm font-medium">Paños *</legend>
            <div className="grid max-h-40 grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3">
              {panos.map((p) => {
                const id = String(p.id)
                return (
                  <label
                    key={id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={panoIds.includes(id)}
                      onCheckedChange={() =>
                        setPanoIds((prev) => toggle(prev, id))
                      }
                    />
                    <span className="truncate">
                      {p.nombre}
                      {p.variedad ? ` · ${p.variedad}` : ""}
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          {/* Objetivos */}
          <fieldset className="flex flex-col gap-2 rounded-md border p-3">
            <legend className="px-1 text-sm font-medium">Objetivos</legend>
            <div className="grid max-h-40 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
              {OBJETIVOS_APP.flatMap((grupo) =>
                grupo.objetivos.map((obj) => (
                  <label key={obj} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={objetivos.includes(obj)}
                      onCheckedChange={() =>
                        setObjetivos((prev) => toggle(prev, obj))
                      }
                    />
                    <span className="truncate">{obj}</span>
                  </label>
                )),
              )}
            </div>
            <Input
              value={form.objetivoOtro}
              onChange={(e) => set("objetivoOtro", e.target.value)}
              placeholder="Otro objetivo…"
            />
          </fieldset>

          {/* Preview de distribución */}
          {preview.distribucion.length > 0 && (
            <div className="rounded-md border">
              <div className="border-b px-3 py-2 text-sm font-medium">
                Distribución · {fmt(preview.tHas)} há · {fmt(preview.tAgua, 0)} L
                agua · {fmt(preview.tProd, 3)} {preview.productos[0]?.unitS ?? ""}{" "}
                (producto principal)
              </div>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="px-3 py-1 text-left">Paño</th>
                      <th className="px-3 py-1 text-right">Há</th>
                      <th className="px-3 py-1 text-right">Agua (L)</th>
                      <th className="px-3 py-1 text-right">Producto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.distribucion.map((d) => (
                      <tr key={d.panoId} className="border-t">
                        <td className="px-3 py-1">{d.panoNombre}</td>
                        <td className="px-3 py-1 text-right">{fmt(d.has)}</td>
                        <td className="px-3 py-1 text-right">
                          {d.agua > 0 ? fmt(d.agua, 0) : "—"}
                        </td>
                        <td className="px-3 py-1 text-right">{fmt(d.prod, 3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={form.notas}
              onChange={(e) => set("notas", e.target.value)}
            />
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
