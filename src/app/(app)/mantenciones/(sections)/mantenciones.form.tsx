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
import {
  MANT_CATEGORIAS,
  MANT_TIPOS_DETALLE,
} from "@/constants/mantenciones.constants"
import { ordenTrabajoSchema } from "@/schemas/mantenciones.schema"
import {
  crearOrden,
  editarOrden,
} from "@/server/mantenciones/mantenciones.actions"
import type {
  MantencionDetalle,
  ProductoServicioOption,
  ProveedorOption,
} from "@/types/mantenciones.types"
import { calcularTotalOT } from "@/utils/mantenciones.utils"
import { formatCLP } from "@/utils/money.utils"

type MantencionFormProps = {
  orden?: MantencionDetalle
  proveedores: ProveedorOption[]
  productos: ProductoServicioOption[]
}

type LineaFila = {
  tipo: string
  productoCodigo: string
  productoNombre: string
  detalle: string
  cantidad: string
  valorUnit: string
}

const SIN_PRODUCTO = "__ninguno__"
const SIN_PROVEEDOR = "__ninguno__"

const lineaVacia = (): LineaFila => ({
  tipo: MANT_TIPOS_DETALLE[0],
  productoCodigo: "",
  productoNombre: "",
  detalle: "",
  cantidad: "1",
  valorUnit: "0",
})

const estadoInicial = (o?: MantencionDetalle) => ({
  fecha: o?.fecha ?? "",
  categoria: o?.categoria || MANT_CATEGORIAS[0],
  activo: o?.activo ?? "",
  descripcion: o?.descripcion ?? "",
  proveedorCodigo: o?.proveedorCodigo ?? "",
})

const lineasIniciales = (o?: MantencionDetalle): LineaFila[] =>
  o?.lineas.length
    ? o.lineas.map((l) => ({
        tipo: l.tipo || MANT_TIPOS_DETALLE[0],
        productoCodigo: l.productoCodigo ?? "",
        productoNombre: l.productoNombre ?? "",
        detalle: l.detalle,
        cantidad: String(l.cantidad),
        valorUnit: String(l.valorUnit),
      }))
    : [lineaVacia()]

export const MantencionForm = ({
  orden,
  proveedores,
  productos,
}: MantencionFormProps) => {
  const router = useRouter()
  const esEdicion = Boolean(orden)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(estadoInicial(orden))
  const [lineas, setLineas] = useState<LineaFila[]>(lineasIniciales(orden))

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const setLinea = (i: number, patch: Partial<LineaFila>) =>
    setLineas((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)),
    )

  const total = calcularTotalOT(
    lineas.map((l) => ({
      cantidad: Number(l.cantidad) || 0,
      valorUnit: Number(l.valorUnit) || 0,
    })),
  )

  const categoriaItems = MANT_CATEGORIAS.map((c) => ({ value: c, label: c }))
  const tipoItems = MANT_TIPOS_DETALLE.map((t) => ({ value: t, label: t }))
  const proveedorItems = [
    { value: SIN_PROVEEDOR, label: "(sin proveedor)" },
    ...proveedores.map((p) => ({ value: p.codigo, label: p.nombre })),
  ]
  const productoItems = [
    { value: SIN_PRODUCTO, label: "(sin producto)" },
    ...productos.map((p) => ({ value: p.codigo, label: p.descripcion })),
  ]

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const payload = {
      fecha: form.fecha,
      categoria: form.categoria,
      activo: form.activo,
      descripcion: form.descripcion,
      proveedorCodigo: form.proveedorCodigo,
      lineas: lineas.map((l) => ({
        tipo: l.tipo,
        productoCodigo: l.productoCodigo,
        productoNombre: l.productoNombre,
        detalle: l.detalle,
        cantidad: Number(l.cantidad) || 0,
        valorUnit: Number(l.valorUnit) || 0,
      })),
    }
    const parsed = ordenTrabajoSchema.safeParse(payload)
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
      toast.success(esEdicion ? "OT actualizada" : "OT creada")
      setOpen(false)
      if (!esEdicion) {
        setForm(estadoInicial())
        setLineas([lineaVacia()])
      }
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
            <Button size="sm">Nueva OT</Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? `Editar ${orden?.numero}` : "Nueva orden de trabajo"}
          </DialogTitle>
          <DialogDescription>
            Los campos marcados con * son obligatorios. El total se calcula a
            partir de las líneas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              <Label>Categoría *</Label>
              <Select
                items={categoriaItems}
                value={form.categoria}
                onValueChange={(v) => set("categoria", v ?? MANT_CATEGORIAS[0])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoriaItems.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="activo">Activo / Equipo</Label>
              <Input
                id="activo"
                value={form.activo}
                onChange={(e) => set("activo", e.target.value)}
                placeholder="Ej: Tractor JD 5075, Torre N°3"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Proveedor</Label>
              <Select
                items={proveedorItems}
                value={form.proveedorCodigo || SIN_PROVEEDOR}
                onValueChange={(v) =>
                  set("proveedorCodigo", !v || v === SIN_PROVEEDOR ? "" : v)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {proveedorItems.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="descripcion">Descripción del trabajo</Label>
            <Textarea
              id="descripcion"
              value={form.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
            />
          </div>

          {/* Líneas de detalle */}
          <fieldset className="flex flex-col gap-2 rounded-md border p-3">
            <legend className="px-1 text-sm font-medium">Detalle</legend>
            {lineas.map((l, i) => (
              <div
                key={i}
                className="grid grid-cols-[minmax(9rem,1fr)_1fr_5rem_7rem_auto] items-center gap-2"
              >
                <Select
                  items={tipoItems}
                  value={l.tipo}
                  onValueChange={(v) =>
                    setLinea(i, { tipo: v ?? MANT_TIPOS_DETALLE[0] })
                  }
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
                <div className="flex flex-col gap-1">
                  <Select
                    items={productoItems}
                    value={l.productoCodigo || SIN_PRODUCTO}
                    onValueChange={(v) => {
                      if (!v || v === SIN_PRODUCTO) {
                        setLinea(i, { productoCodigo: "", productoNombre: "" })
                        return
                      }
                      const prod = productos.find((p) => p.codigo === v)
                      setLinea(i, {
                        productoCodigo: v,
                        productoNombre: prod?.descripcion ?? "",
                      })
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {productoItems.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={l.detalle}
                    onChange={(e) => setLinea(i, { detalle: e.target.value })}
                    placeholder="Detalle…"
                  />
                </div>
                <Input
                  inputMode="decimal"
                  value={l.cantidad}
                  onChange={(e) => setLinea(i, { cantidad: e.target.value })}
                  placeholder="Cant."
                />
                <Input
                  inputMode="decimal"
                  value={l.valorUnit}
                  onChange={(e) => setLinea(i, { valorUnit: e.target.value })}
                  placeholder="Valor unit."
                />
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
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLineas((prev) => [...prev, lineaVacia()])}
              >
                + Añadir línea
              </Button>
              <span className="text-sm font-medium">
                Total: {formatCLP(total)}
              </span>
            </div>
          </fieldset>

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
