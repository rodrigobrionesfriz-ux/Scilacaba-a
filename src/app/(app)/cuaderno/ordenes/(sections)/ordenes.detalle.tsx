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
import type { OrdenRow } from "@/types/ordenes.types"

const fmt = (n: number, d = 2) =>
  n.toLocaleString("es-CL", { maximumFractionDigits: d })

export const OrdenDetalle = ({ orden }: { orden: OrdenRow }) => {
  const [open, setOpen] = useState(false)

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
          <DialogTitle>{orden.numero}</DialogTitle>
          <DialogDescription>
            {orden.fecha} · {orden.tipoApp} · {orden.fenologico} ·{" "}
            {orden.estado}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm">
          {orden.objetivos.length > 0 && (
            <p>
              <span className="font-medium">Objetivos: </span>
              {orden.objetivos.join(", ")}
              {orden.objetivoOtro ? ` · ${orden.objetivoOtro}` : ""}
            </p>
          )}

          <div>
            <p className="mb-1 font-medium">
              Productos · total {fmt(orden.tAgua, 0)} L de agua
            </p>
            <ul className="list-inside list-disc">
              {orden.productos.map((p) => (
                <li key={p.nombre}>
                  {p.nombre}: {fmt(p.dosis, 3)} {p.unidad} → {fmt(p.tProd, 3)}{" "}
                  {p.unitS}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md border">
            <table className="w-full">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="px-3 py-1 text-left">Paño</th>
                  <th className="px-3 py-1 text-left">Variedad</th>
                  <th className="px-3 py-1 text-right">Há</th>
                  <th className="px-3 py-1 text-right">Agua (L)</th>
                  <th className="px-3 py-1 text-right">Producto</th>
                </tr>
              </thead>
              <tbody>
                {orden.distribucion.map((d) => (
                  <tr key={d.panoId} className="border-t">
                    <td className="px-3 py-1">{d.panoNombre}</td>
                    <td className="px-3 py-1">{d.variedad || "—"}</td>
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

          {orden.notas && (
            <p>
              <span className="font-medium">Notas: </span>
              {orden.notas}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
