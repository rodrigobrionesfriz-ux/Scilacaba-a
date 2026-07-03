"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { OT_ESTADOS } from "@/constants/mantenciones.constants"
import type { MantencionDetalle } from "@/types/mantenciones.types"
import { formatCLP } from "@/utils/money.utils"

export const MantencionDetalleDialog = ({
  orden,
}: {
  orden: MantencionDetalle
}) => {
  const [open, setOpen] = useState(false)
  const meta = OT_ESTADOS[orden.estado]

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
          <DialogTitle className="flex items-center gap-2">
            {orden.numero}
            <Badge variant={meta?.variant ?? "outline"}>
              {meta?.label ?? orden.estado}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {orden.fecha} · {orden.categoria}
            {orden.activo ? ` · ${orden.activo}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm">
          {orden.proveedorNombre && (
            <p>
              <span className="font-medium">Proveedor: </span>
              {orden.proveedorNombre}
            </p>
          )}
          {orden.descripcion && (
            <p>
              <span className="font-medium">Descripción: </span>
              {orden.descripcion}
            </p>
          )}

          <div className="rounded-md border">
            <table className="w-full">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="px-3 py-1 text-left">Tipo</th>
                  <th className="px-3 py-1 text-left">Detalle</th>
                  <th className="px-3 py-1 text-right">Cant.</th>
                  <th className="px-3 py-1 text-right">Valor unit.</th>
                  <th className="px-3 py-1 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {orden.lineas.map((l) => (
                  <tr key={l.id} className="border-t">
                    <td className="px-3 py-1">{l.tipo}</td>
                    <td className="px-3 py-1">
                      {l.productoNombre
                        ? `${l.productoNombre}${l.detalle ? ` · ${l.detalle}` : ""}`
                        : l.detalle || "—"}
                    </td>
                    <td className="px-3 py-1 text-right">{l.cantidad}</td>
                    <td className="px-3 py-1 text-right">
                      {formatCLP(l.valorUnit)}
                    </td>
                    <td className="px-3 py-1 text-right">
                      {formatCLP(l.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-medium">
                  <td className="px-3 py-1" colSpan={4}>
                    Total
                  </td>
                  <td className="px-3 py-1 text-right">
                    {formatCLP(orden.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {orden.factura && (
            <div className="rounded-md border p-3">
              <p className="mb-1 font-medium">Factura</p>
              <p>
                {orden.factura.tipoDoc} {orden.factura.numeroDoc} ·{" "}
                {orden.factura.fecha} · {formatCLP(orden.factura.monto)}
              </p>
              {orden.factura.horometro !== null && (
                <p className="text-muted-foreground">
                  Horómetro: {orden.factura.horometro} hrs
                </p>
              )}
              {orden.factura.obs && (
                <p className="text-muted-foreground">{orden.factura.obs}</p>
              )}
              <p className="text-muted-foreground">
                Movimiento: {orden.factura.movimiento}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
