"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Aportes, OafRow, ProductoFertRow } from "@/types/fertirriego.types"
import { calcularAportes } from "@/utils/fertirriego.utils"

const fmt = (n: number, d = 2) =>
  n.toLocaleString("es-CL", { maximumFractionDigits: d })

type OafDetalleProps = {
  orden: OafRow
  productos: ProductoFertRow[]
}

export const OafDetalle = ({ orden, productos }: OafDetalleProps) => {
  const [open, setOpen] = useState(false)

  const aportesPorProducto = new Map<string, Aportes>(
    productos.map((p) => [p.nombre, p.aportes]),
  )
  const aportes = calcularAportes(orden.lineas, aportesPorProducto, orden.haTotal)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            Ver
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {orden.numero}
            {orden.confirmada ? " · Confirmada" : " · Pendiente"}
          </DialogTitle>
          <DialogDescription>
            {orden.fecha || "Sin fecha"} · {orden.forma || "—"} ·{" "}
            {orden.horario || "—"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm">
          {orden.estado && (
            <p>
              <span className="font-medium">Estado fenológico: </span>
              {orden.estado}
            </p>
          )}
          {orden.responsable && (
            <p>
              <span className="font-medium">Responsable: </span>
              {orden.responsable}
            </p>
          )}

          <p>
            <span className="font-medium">Sectores </span>(
            {fmt(orden.haTotal)} há): {orden.nombresSectores.join(", ") || "—"}
          </p>

          <div className="rounded-md border">
            <table className="w-full">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="px-3 py-1 text-left">Producto</th>
                  <th className="px-3 py-1 text-right">Dosis</th>
                  <th className="px-3 py-1 text-left">Obs.</th>
                </tr>
              </thead>
              <tbody>
                {orden.lineas.map((l, i) => (
                  <tr key={`${l.prod}-${i}`} className="border-t">
                    <td className="px-3 py-1">{l.prod}</td>
                    <td className="px-3 py-1 text-right">
                      {fmt(l.dosis, 3)} {l.unidad}
                    </td>
                    <td className="px-3 py-1 text-muted-foreground">
                      {l.obs || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {aportes.length > 0 && (
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="mb-2 font-medium">
                Aporte nutricional estimado (total orden · {fmt(orden.haTotal)} há)
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
                    <div className="font-semibold">{fmt(a.kg, 2)}</div>
                    <div className="text-[10px] text-muted-foreground">kg</div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Estimación según dosis × superficie × % de cada producto.
                Conversión aproximada de unidades a kg.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
