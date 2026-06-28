"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { MovimientoLineaForm } from "@/types/movimientos.types"
import type { ProductoRow } from "@/types/productos.types"

type MovimientoLineaFilaProps = {
  linea: MovimientoLineaForm
  index: number
  productos: ProductoRow[]
  onChange: (index: number, patch: Partial<MovimientoLineaForm>) => void
  onRemove: (index: number) => void
}

export const MovimientoLineaFila = ({
  linea,
  index,
  productos,
  onChange,
  onRemove,
}: MovimientoLineaFilaProps) => {
  const producto = productos.find((p) => p.codigoInterno === linea.codigoInterno)
  const maneja = producto?.manejaAtributos ?? false
  const productoItems = productos.map((p) => ({
    value: p.codigoInterno,
    label: `${p.codigoInterno} · ${p.descripcion}`,
  }))

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex items-end gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <Label>Producto *</Label>
          <Select
            items={productoItems}
            value={linea.codigoInterno}
            onValueChange={(v) => {
              const p = productos.find((x) => x.codigoInterno === (v ?? ""))
              onChange(index, {
                codigoInterno: v ?? "",
                descripcion: p?.descripcion ?? "",
                unidadMedida: p?.unidadMedida ?? "",
              })
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona un producto…" />
            </SelectTrigger>
            <SelectContent>
              {productoItems.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onRemove(index)}
          aria-label="Quitar línea"
        >
          <X />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-2">
          <Label>Cantidad *</Label>
          <Input
            type="number"
            min={0}
            step="any"
            value={linea.cantidad}
            onChange={(e) => onChange(index, { cantidad: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Costo unitario *</Label>
          <Input
            type="number"
            min={0}
            step="any"
            value={linea.costo}
            onChange={(e) => onChange(index, { costo: e.target.value })}
          />
        </div>
        {maneja && (
          <>
            <div className="flex flex-col gap-2">
              <Label>Lote</Label>
              <Input
                value={linea.lote}
                onChange={(e) => onChange(index, { lote: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Vence</Label>
              <Input
                type="date"
                value={linea.fechaVenc}
                onChange={(e) => onChange(index, { fechaVenc: e.target.value })}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
