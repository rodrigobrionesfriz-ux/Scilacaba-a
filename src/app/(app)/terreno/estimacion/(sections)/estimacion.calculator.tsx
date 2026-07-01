"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PESOS_ESTADO_DEFAULT } from "@/constants/terreno.constants"
import { guardarEstimacionSchema } from "@/schemas/estimaciones.schema"
import { guardarEstimacion } from "@/server/estimaciones/estimaciones.actions"
import type { PanoEstimBase, PesosEstado } from "@/types/estimaciones.types"
import {
  aCajas,
  aToneladas,
  kgLinea,
  plantasProductivas,
  plantasUsadas,
} from "@/utils/estimaciones.utils"

type LineaForm = {
  panoId: number
  panoNombre: string
  variedad: string
  centros: string
  frutosCentro: string
  kgFruto: string
  plantas: string
  desglose: PanoEstimBase["desglose"]
  plantasInvTotal: number | null
  usarEquiv: boolean
  pesosEstado: PesosEstado
}

const fmt = (n: number, d = 1) =>
  n.toLocaleString("es-CL", { maximumFractionDigits: d })

const aLineaForm = (b: PanoEstimBase): LineaForm => ({
  panoId: b.panoId,
  panoNombre: b.panoNombre,
  variedad: b.variedad,
  centros: String(b.centros),
  frutosCentro: String(b.frutosCentro),
  kgFruto: String(b.kgFruto),
  plantas: String(b.plantas),
  desglose: b.desglose,
  plantasInvTotal: b.plantasInvTotal,
  usarEquiv: b.usarEquiv,
  pesosEstado: b.pesosEstado,
})

// Derivados en vivo de una línea: misma fórmula pura que usa la Server Action
// al guardar (index.html: cteRenderEstimVer/ctePlantasProductivas).
const derivar = (l: LineaForm) => {
  const plantasEquiv = l.desglose
    ? plantasProductivas(l.desglose, l.pesosEstado).equiv
    : null
  const plantas = Number(l.plantas) || 0
  const usadas = plantasUsadas({ usarEquiv: l.usarEquiv, plantas, plantasEquiv })
  const kgPano = kgLinea(
    Number(l.centros) || 0,
    Number(l.frutosCentro) || 0,
    Number(l.kgFruto) || 0,
    usadas,
  )
  return { plantasEquiv, plantasUsadas: usadas, kgPano }
}

export const EstimacionCalculator = ({ base }: { base: PanoEstimBase[] }) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [nombre, setNombre] = useState("")
  const [lineas, setLineas] = useState<LineaForm[]>(base.map(aLineaForm))
  const [pesosGlobal, setPesosGlobal] = useState(
    Object.fromEntries(
      Object.entries(PESOS_ESTADO_DEFAULT).map(([k, v]) => [k, String(v)]),
    ) as Record<keyof PesosEstado, string>,
  )

  const setLinea = <K extends keyof LineaForm>(
    i: number,
    key: K,
    value: LineaForm[K],
  ) =>
    setLineas((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)),
    )

  const aplicarPesosGlobal = () => {
    const pesos: PesosEstado = {
      sano: Number(pesosGlobal.sano) || 0,
      debil: Number(pesosGlobal.debil) || 0,
      muerto: Number(pesosGlobal.muerto) || 0,
      replante: Number(pesosGlobal.replante) || 0,
      falta: Number(pesosGlobal.falta) || 0,
    }
    setLineas((prev) => prev.map((l) => ({ ...l, pesosEstado: pesos })))
    toast.success("Pesos aplicados a todas las líneas")
  }

  const derivadas = lineas.map((l) => derivar(l))
  const totalKg = derivadas.reduce((acc, d) => acc + d.kgPano, 0)

  const onGuardar = () => {
    if (!nombre.trim())
      return toast.error("Ingresa un nombre para la estimación")
    const payload = {
      nombre,
      lineas: lineas.map((l, i) => ({
        panoId: l.panoId,
        panoNombre: l.panoNombre,
        variedad: l.variedad,
        centros: Number(l.centros) || 0,
        frutosCentro: Number(l.frutosCentro) || 0,
        kgFruto: Number(l.kgFruto) || 0,
        plantas: Number(l.plantas) || 0,
        desglose: l.desglose,
        plantasEquiv: derivadas[i].plantasEquiv,
        plantasInvTotal: l.plantasInvTotal,
        usarEquiv: l.usarEquiv,
        pesosEstado: l.pesosEstado,
      })),
    }
    const parsed = guardarEstimacionSchema.safeParse(payload)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = await guardarEstimacion(parsed.data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Estimación guardada")
      setNombre("")
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-wrap items-end gap-3 rounded-md border p-3">
        <legend className="px-1 text-sm font-medium">
          Pesos de producción por estado (%)
        </legend>
        {Object.keys(pesosGlobal).map((estado) => (
          <div key={estado} className="flex flex-col gap-1.5">
            <Label htmlFor={`peso-${estado}`} className="capitalize">
              {estado}
            </Label>
            <Input
              id={`peso-${estado}`}
              className="w-20"
              inputMode="decimal"
              value={pesosGlobal[estado as keyof PesosEstado]}
              onChange={(e) =>
                setPesosGlobal((prev) => ({
                  ...prev,
                  [estado]: e.target.value,
                }))
              }
            />
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={aplicarPesosGlobal}>
          Aplicar a todas las líneas
        </Button>
      </fieldset>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Paño</th>
              <th className="px-3 py-2 text-right">Centros</th>
              <th className="px-3 py-2 text-right">Frutos/centro</th>
              <th className="px-3 py-2 text-right">Kg/fruto</th>
              <th className="px-3 py-2 text-right">Plantas</th>
              <th className="px-3 py-2 text-center">Usar equiv.</th>
              <th className="px-3 py-2 text-right">Plantas usadas</th>
              <th className="px-3 py-2 text-right">Kg estimados</th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((l, i) => (
              <tr key={l.panoId} className="border-t">
                <td className="px-3 py-2">
                  {l.panoNombre}
                  {l.variedad ? ` · ${l.variedad}` : ""}
                </td>
                <td className="px-3 py-2 text-right">
                  <Input
                    className="w-20 text-right"
                    inputMode="decimal"
                    value={l.centros}
                    onChange={(e) => setLinea(i, "centros", e.target.value)}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <Input
                    className="w-20 text-right"
                    inputMode="decimal"
                    value={l.frutosCentro}
                    onChange={(e) =>
                      setLinea(i, "frutosCentro", e.target.value)
                    }
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <Input
                    className="w-20 text-right"
                    inputMode="decimal"
                    value={l.kgFruto}
                    onChange={(e) => setLinea(i, "kgFruto", e.target.value)}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <Input
                    className="w-24 text-right"
                    inputMode="decimal"
                    disabled={l.usarEquiv && derivadas[i].plantasEquiv !== null}
                    value={l.plantas}
                    onChange={(e) => setLinea(i, "plantas", e.target.value)}
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <Checkbox
                    checked={l.usarEquiv}
                    disabled={l.desglose === null}
                    onCheckedChange={(v) => setLinea(i, "usarEquiv", Boolean(v))}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  {fmt(derivadas[i].plantasUsadas)}
                  {l.plantasInvTotal !== null && (
                    <span className="text-muted-foreground">
                      {" "}
                      / {l.plantasInvTotal} en huerto
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-medium">
                  {fmt(derivadas[i].kgPano, 1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm">
        <span>
          <strong>Total: {fmt(totalKg, 1)} kg</strong> · {fmt(aCajas(totalKg))}{" "}
          cajas (5 kg) · {fmt(aToneladas(totalKg), 3)} ton
        </span>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Nombre de la estimación…"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-56"
          />
          <Button type="button" disabled={pending} onClick={onGuardar}>
            {pending ? "Guardando…" : "Guardar estimación"}
          </Button>
        </div>
      </div>
    </div>
  )
}
