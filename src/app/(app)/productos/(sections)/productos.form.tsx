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
import { UNIDADES_MEDIDA } from "@/constants/productos.constants"
import { productoSchema } from "@/schemas/productos.schema"
import {
  crearProducto,
  editarProducto,
} from "@/server/productos/productos.actions"
import type { Group, ProductType } from "@/types/catalogos.types"
import type { ProductoRow } from "@/types/productos.types"

type ProductoFormProps = {
  producto?: ProductoRow
  tipos: ProductType[]
  grupos: Group[]
}

const estadoInicial = (p?: ProductoRow) => ({
  descripcion: p?.descripcion ?? "",
  unidadMedida: p?.unidadMedida ?? "",
  tipoProducto: p?.tipoProducto ?? "",
  grupo: p?.grupo ?? "",
  subGrupo: p?.subGrupo ?? "",
  codigoEan: p?.codigoEan ?? "",
  manejaAtributos: p?.manejaAtributos ?? false,
  inventariable: p?.inventariable ?? true,
  stockMinimo: p ? String(p.stockMinimo) : "0",
  aplicaIva: p?.aplicaIva ?? true,
  aplicaIec: p?.aplicaIec ?? false,
  aplicaIla: p?.aplicaIla ?? false,
  ccTipo: p?.ccTipo ?? "",
  ccIngredienteActivo: p?.ccIngredienteActivo ?? "",
  ccObjetivo: p?.ccObjetivo ?? "",
  ccDosis: p?.ccDosis === null || p?.ccDosis === undefined ? "" : String(p.ccDosis),
  ccUnidad: p?.ccUnidad ?? "",
  activo: p?.activo ?? true,
})

export const ProductoForm = ({ producto, tipos, grupos }: ProductoFormProps) => {
  const router = useRouter()
  const esEdicion = Boolean(producto)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(estadoInicial(producto))

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const subgrupos = grupos.find((g) => g.nombre === form.grupo)?.subgrupos ?? []

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsed = productoSchema.safeParse({
      ...form,
      ccDosis: form.ccDosis === "" ? null : form.ccDosis,
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = producto
        ? await editarProducto(producto.codigoInterno, parsed.data)
        : await crearProducto(parsed.data)
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {esEdicion
              ? `Editar ${producto?.codigoInterno}`
              : "Nuevo producto"}
          </DialogTitle>
          <DialogDescription>
            Completa los datos del producto. Los marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Input
              id="descripcion"
              value={form.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="codigoEan">Código EAN</Label>
              <Input
                id="codigoEan"
                value={form.codigoEan}
                onChange={(e) => set("codigoEan", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Unidad de medida *</Label>
              <Select
                value={form.unidadMedida}
                onValueChange={(v) => set("unidadMedida", v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES_MEDIDA.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Tipo de producto *</Label>
              <Select
                value={form.tipoProducto}
                onValueChange={(v) => set("tipoProducto", v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {tipos.map((t) => (
                    <SelectItem key={t.nombre} value={t.nombre}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Grupo *</Label>
              <Select
                value={form.grupo}
                onValueChange={(v) => {
                  set("grupo", v ?? "")
                  set("subGrupo", "")
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {grupos.map((g) => (
                    <SelectItem key={g.nombre} value={g.nombre}>
                      {g.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {subgrupos.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>Sub-grupo</Label>
              <Select
                value={form.subGrupo}
                onValueChange={(v) => set("subGrupo", v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {subgrupos.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="stockMinimo">Stock mínimo</Label>
            <Input
              id="stockMinimo"
              type="number"
              min={0}
              step="any"
              value={form.stockMinimo}
              onChange={(e) => set("stockMinimo", e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.inventariable}
                onCheckedChange={(c) => set("inventariable", c)}
              />
              Inventariable
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.manejaAtributos}
                onCheckedChange={(c) => set("manejaAtributos", c)}
              />
              Maneja atributos
            </label>
            {esEdicion && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.activo}
                  onCheckedChange={(c) => set("activo", c)}
                />
                Activo
              </label>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.aplicaIva}
                onCheckedChange={(c) => set("aplicaIva", c)}
              />
              Aplica IVA
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.aplicaIec}
                onCheckedChange={(c) => set("aplicaIec", c)}
              />
              Aplica IEC
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.aplicaIla}
                onCheckedChange={(c) => set("aplicaIla", c)}
              />
              Aplica ILA
            </label>
          </div>
          <fieldset className="flex flex-col gap-3 rounded-lg border p-3">
            <legend className="px-1 text-xs text-muted-foreground">
              Datos agronómicos (Cuaderno de Campo)
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ccTipo">Tipo</Label>
                <Input
                  id="ccTipo"
                  value={form.ccTipo}
                  onChange={(e) => set("ccTipo", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ccIngredienteActivo">Ingrediente activo</Label>
                <Input
                  id="ccIngredienteActivo"
                  value={form.ccIngredienteActivo}
                  onChange={(e) => set("ccIngredienteActivo", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ccObjetivo">Objetivo</Label>
                <Input
                  id="ccObjetivo"
                  value={form.ccObjetivo}
                  onChange={(e) => set("ccObjetivo", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ccDosis">Dosis</Label>
                <Input
                  id="ccDosis"
                  type="number"
                  min={0}
                  step="any"
                  value={form.ccDosis}
                  onChange={(e) => set("ccDosis", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ccUnidad">Unidad</Label>
                <Input
                  id="ccUnidad"
                  value={form.ccUnidad}
                  onChange={(e) => set("ccUnidad", e.target.value)}
                />
              </div>
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
