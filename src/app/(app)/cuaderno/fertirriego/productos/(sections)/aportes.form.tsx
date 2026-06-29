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
import { FR_NUTRIENTES } from "@/constants/fertirriego.constants"
import { aportesSchema } from "@/schemas/aportes.schema"
import { guardarAportes } from "@/server/productos-cuaderno/productos-cuaderno.actions"
import type { Nutriente, ProductoFertRow } from "@/types/fertirriego.types"
import { buscarAporteBase } from "@/utils/fertirriego.utils"

type AporteFila = Record<Nutriente, string>

const aportesIniciales = (producto: ProductoFertRow): AporteFila => {
  const out = {} as AporteFila
  for (const nu of FR_NUTRIENTES)
    out[nu] = producto.aportes[nu] == null ? "" : String(producto.aportes[nu])
  return out
}

export const AportesForm = ({ producto }: { producto: ProductoFertRow }) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [unidad, setUnidad] = useState(producto.unidad)
  const [dosis, setDosis] = useState(producto.dosis)
  const [aportes, setAportes] = useState<AporteFila>(aportesIniciales(producto))

  const setNutriente = (nu: Nutriente, value: string) =>
    setAportes((prev) => ({ ...prev, [nu]: value }))

  const autocompletar = () => {
    const base = buscarAporteBase(producto.nombre)
    if (!base) {
      toast.error("Sin coincidencia en la base de fertilizantes")
      return
    }
    const next = {} as AporteFila
    for (const nu of FR_NUTRIENTES)
      next[nu] = base.ap[nu] == null ? "" : String(base.ap[nu])
    setAportes(next)
    toast.success(`Autocompletado desde: ${base.nombreBase}`)
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const limpias = Object.fromEntries(
      FR_NUTRIENTES.filter((nu) => aportes[nu].trim() !== "").map((nu) => [
        nu,
        aportes[nu],
      ]),
    )
    const parsed = aportesSchema.safeParse({
      nombre: producto.nombre,
      unidad,
      dosis,
      aportes: limpias,
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = await guardarAportes(parsed.data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Composición guardada")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            Editar aportes
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{producto.nombre}</DialogTitle>
          <DialogDescription>
            Composición nutricional (% elemental) y dosis por defecto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="unidad">Unidad</Label>
              <Input
                id="unidad"
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                placeholder="Ej: kg"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dosis">Dosis por defecto</Label>
              <Input
                id="dosis"
                value={dosis}
                onChange={(e) => setDosis(e.target.value)}
              />
            </div>
          </div>

          <fieldset className="flex flex-col gap-2 rounded-md border p-3">
            <legend className="px-1 text-sm font-medium">
              Nutrientes (% en peso)
            </legend>
            <div className="grid grid-cols-4 gap-2">
              {FR_NUTRIENTES.map((nu) => (
                <div key={nu} className="flex flex-col gap-1">
                  <Label htmlFor={`nu-${nu}`} className="text-xs">
                    {nu}
                  </Label>
                  <Input
                    id={`nu-${nu}`}
                    inputMode="decimal"
                    value={aportes[nu]}
                    onChange={(e) => setNutriente(nu, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={autocompletar}
            >
              Autocompletar desde base
            </Button>
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
