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
import type { EstimacionRow } from "@/types/estimaciones.types"
import { aCajas, aToneladas } from "@/utils/estimaciones.utils"

const fmt = (n: number, d = 1) =>
  n.toLocaleString("es-CL", { maximumFractionDigits: d })

// Vista de solo lectura del desglose de líneas de una versión guardada.
export const EstimacionDetalleDialog = ({
  version,
}: {
  version: EstimacionRow
}) => {
  const [open, setOpen] = useState(false)
  const totalKg = version.totalKg ?? 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            Ver detalle
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{version.nombre}</DialogTitle>
          <DialogDescription>
            {new Date(version.fecha).toLocaleString("es-CL")} ·{" "}
            {version.usuario || "—"} · Total {fmt(totalKg)} kg ·{" "}
            {fmt(aCajas(totalKg))} cajas (5 kg) · {fmt(aToneladas(totalKg), 3)}{" "}
            ton
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Paño</th>
                <th className="px-3 py-2 text-right">Centros</th>
                <th className="px-3 py-2 text-right">Frutos/centro</th>
                <th className="px-3 py-2 text-right">Kg/fruto</th>
                <th className="px-3 py-2 text-right">Plantas usadas</th>
                <th className="px-3 py-2 text-right">Kg estimados</th>
              </tr>
            </thead>
            <tbody>
              {version.lineas.map((l) => (
                <tr key={l.panoId} className="border-t">
                  <td className="px-3 py-2">
                    {l.panoNombre}
                    {l.variedad ? ` · ${l.variedad}` : ""}
                  </td>
                  <td className="px-3 py-2 text-right">{fmt(l.centros)}</td>
                  <td className="px-3 py-2 text-right">
                    {fmt(l.frutosCentro)}
                  </td>
                  <td className="px-3 py-2 text-right">{fmt(l.kgFruto, 3)}</td>
                  <td className="px-3 py-2 text-right">
                    {fmt(l.plantasUsadas)}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {fmt(l.kgPano, 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
