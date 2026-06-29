"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ESTADOS_PLANTA } from "@/constants/terreno.constants"
import { actualizarPanoPlantas } from "@/server/panos/panos.actions"
import type { CuartelOpcion, InvplantaRow } from "@/types/invplantas.types"
import { resumenPorPano } from "@/utils/invplantas.utils"

export const InvplantasResumen = ({
  filas,
  cuarteles,
  puedeActualizarPano,
}: {
  filas: InvplantaRow[]
  cuarteles: CuartelOpcion[]
  puedeActualizarPano: boolean
}) => {
  const [pending, startTransition] = useTransition()
  const resumen = resumenPorPano(filas)

  if (resumen.length === 0)
    return (
      <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        Aún no hay hileras sincronizadas para resumir.
      </p>
    )

  const actualizar = (panoId: number | null, plantas: number) => {
    if (panoId === null) return toast.error("La hilera no tiene cuartel asociado")
    startTransition(async () => {
      const res = await actualizarPanoPlantas({ panoId, plantas })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("N° de plantas del paño actualizado")
    })
  }

  return (
    <ul className="flex flex-col gap-3">
      {resumen.map((r) => {
        const enCuaderno =
          cuarteles.find((c) => c.id === r.cuartelId)?.plantas ?? null
        const dif = enCuaderno === null ? null : r.totalPlantas - enCuaderno
        return (
          <li key={r.clave} className="rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                {r.cuartel || "—"}{" "}
                <span className="font-normal text-muted-foreground">
                  {r.variedad}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {r.nHileras} hilera(s) · 🌳 {r.principal} · 🐝 {r.poliniz} ·
                Total {r.totalPlantas}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              {ESTADOS_PLANTA.map((e) => (
                <span key={e.value} className="flex items-center gap-1">
                  <span
                    className="inline-block size-3 rounded-full"
                    style={{ backgroundColor: e.color }}
                  />
                  {e.label}: {r.estados[e.value]}
                </span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {dif === null
                  ? "Sin registro en el Cuaderno"
                  : dif === 0
                    ? `✓ Coincide con el Cuaderno (${enCuaderno})`
                    : `Cuaderno: ${enCuaderno} · diferencia ${dif > 0 ? "+" : ""}${dif}`}
              </span>
              {puedeActualizarPano && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending || r.cuartelId === null}
                  onClick={() => actualizar(r.cuartelId, r.totalPlantas)}
                >
                  ⟳ Actualizar paño a {r.totalPlantas}
                </Button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
