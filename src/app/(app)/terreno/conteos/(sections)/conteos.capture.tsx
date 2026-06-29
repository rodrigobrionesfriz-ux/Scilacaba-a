"use client"

import { useState } from "react"
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
import {
  ESPECIE_DEFAULT,
  ETAPAS_FENOLOGICAS,
  FIJOS_CODIGOS_DEFAULT,
} from "@/constants/terreno.constants"
import { cn } from "@/lib/utils"
import { guardarConteoLocal } from "@/lib/terreno-db"
import type { ArbolCapturado, PanoOpcion, TipoArbol } from "@/types/conteos.types"
import { formatGps, resumenConteo } from "@/utils/conteos.utils"

type Gps = { lat: number; lng: number; precision: number }

const capturarGps = (): Promise<Gps | null> =>
  new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          precision: p.coords.accuracy,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  })

const siguienteCodigo = (arboles: ArbolCapturado[], tipo: TipoArbol) => {
  const i = arboles.filter((a) => a.tipo === tipo).length
  if (tipo === "fijo") return FIJOS_CODIGOS_DEFAULT[i] ?? `F${i + 1}`
  return `Azar ${i + 1}`
}

const metaInicial = {
  panoId: null as number | null,
  panoNombre: "",
  variedad: "",
  etapa: "",
}

export const ConteosCapture = ({
  panos,
  usuario,
}: {
  panos: PanoOpcion[]
  usuario: string
}) => {
  const [open, setOpen] = useState(false)
  const [paso, setPaso] = useState<"inicio" | "sesion">("inicio")
  const [meta, setMeta] = useState(metaInicial)
  const [inicio, setInicio] = useState("")
  const [arboles, setArboles] = useState<ArbolCapturado[]>([])
  const [tipo, setTipo] = useState<TipoArbol>("fijo")
  const [centros, setCentros] = useState(0)
  const [gps, setGps] = useState<Gps | null>(null)
  const [capturandoGps, setCapturandoGps] = useState(false)

  const panoItems = panos.map((p) => ({ value: String(p.id), label: p.nombre }))
  const etapaItems = ETAPAS_FENOLOGICAS.map((e) => ({ value: e, label: e }))

  const reset = () => {
    setPaso("inicio")
    setMeta(metaInicial)
    setInicio("")
    setArboles([])
    setTipo("fijo")
    setCentros(0)
    setGps(null)
  }

  const elegirPano = (id: string) => {
    const p = panos.find((x) => String(x.id) === id)
    setMeta((m) => ({
      ...m,
      panoId: p ? p.id : null,
      panoNombre: p?.nombre ?? "",
      variedad: p?.variedad ?? m.variedad,
    }))
  }

  const iniciar = () => {
    if (meta.panoId === null) return toast.error("Selecciona un paño")
    setInicio(new Date().toISOString())
    setPaso("sesion")
  }

  const tomarGps = async () => {
    setCapturandoGps(true)
    const pos = await capturarGps()
    setCapturandoGps(false)
    if (!pos) return toast.error("No se pudo obtener GPS (sin permiso o señal)")
    setGps(pos)
  }

  const agregarArbol = () => {
    setArboles((prev) => [
      ...prev,
      {
        n: prev.length + 1,
        centros,
        tipo,
        codigo: siguienteCodigo(prev, tipo),
        lat: gps?.lat ?? null,
        lng: gps?.lng ?? null,
        precision: gps?.precision ?? null,
        fecha: new Date().toISOString(),
      },
    ])
    setCentros(0)
    setGps(null)
  }

  const finalizar = async () => {
    if (arboles.length === 0) return toast.error("Agrega al menos un árbol")
    const resumen = resumenConteo(arboles)
    try {
      await guardarConteoLocal({
        id: crypto.randomUUID(),
        panoId: meta.panoId,
        panoNombre: meta.panoNombre,
        variedad: meta.variedad,
        especie: ESPECIE_DEFAULT,
        etapa: meta.etapa,
        fijosCodigos: [...FIJOS_CODIGOS_DEFAULT],
        usuario,
        arboles,
        promedioCentros: resumen.promedio,
        nArboles: arboles.length,
        fechaInicio: inicio,
        fechaFin: new Date().toISOString(),
      })
      toast.success("Conteo guardado en el dispositivo")
      reset()
      setOpen(false)
    } catch {
      toast.error("No se pudo guardar localmente. Reintenta.")
    }
  }

  const resumen = resumenConteo(arboles)

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger render={<Button size="sm">Nuevo conteo</Button>} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Conteo de centros florales</DialogTitle>
          <DialogDescription>
            {paso === "inicio"
              ? "Selecciona el paño y la etapa para iniciar."
              : `${meta.panoNombre} · ${meta.variedad || "—"} · ${meta.etapa || "—"}`}
          </DialogDescription>
        </DialogHeader>

        {paso === "inicio" ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Paño *</Label>
              <Select
                items={panoItems}
                value={meta.panoId === null ? "" : String(meta.panoId)}
                onValueChange={(v) => elegirPano(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {panoItems.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="variedad">Variedad</Label>
                <Input
                  id="variedad"
                  value={meta.variedad}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, variedad: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Etapa fenológica</Label>
                <Select
                  items={etapaItems}
                  value={meta.etapa}
                  onValueChange={(v) =>
                    setMeta((m) => ({ ...m, etapa: v ?? "" }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona…" />
                  </SelectTrigger>
                  <SelectContent>
                    {etapaItems.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={iniciar}>Iniciar conteo</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              {(["fijo", "aleatorio"] as const).map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={tipo === t ? "default" : "outline"}
                  size="sm"
                  className="flex-1 capitalize"
                  onClick={() => setTipo(t)}
                >
                  {t}
                </Button>
              ))}
            </div>
            <div className="flex flex-col items-center gap-2">
              <Label>Centros florales</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCentros((c) => Math.max(0, c - 1))}
                >
                  −
                </Button>
                <span className="w-16 text-center text-3xl font-bold tabular-nums">
                  {centros}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCentros((c) => c + 1)}
                >
                  +
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={tomarGps}
                disabled={capturandoGps}
              >
                {capturandoGps ? "Capturando…" : "Capturar GPS"}
              </Button>
              <span className="text-xs text-muted-foreground">
                {gps ? formatGps(gps.lat, gps.lng) : "Sin GPS"}
              </span>
              <Button type="button" size="sm" onClick={agregarArbol}>
                Agregar árbol
              </Button>
            </div>

            <div className="rounded-md border">
              <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2 text-xs font-medium">
                <span>
                  {resumen.total} árbol(es) · F:{resumen.fijos} A:
                  {resumen.aleatorios}
                </span>
                <span>Promedio: {resumen.promedio.toFixed(1)}</span>
              </div>
              <ul className="max-h-40 overflow-y-auto text-sm">
                {arboles.length === 0 ? (
                  <li className="px-3 py-2 text-muted-foreground">
                    Aún no agregas árboles.
                  </li>
                ) : (
                  arboles.map((a) => (
                    <li
                      key={a.n}
                      className={cn(
                        "flex items-center justify-between px-3 py-1.5",
                        a.n % 2 === 0 && "bg-muted/20",
                      )}
                    >
                      <span>
                        {a.n}. {a.codigo}
                      </span>
                      <span className="tabular-nums">{a.centros} centros</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={reset}>
                Cancelar
              </Button>
              <Button type="button" onClick={finalizar}>
                Finalizar y guardar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
