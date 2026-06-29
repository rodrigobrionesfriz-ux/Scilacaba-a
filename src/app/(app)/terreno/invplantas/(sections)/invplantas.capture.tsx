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
  ESTADOS_PLANTA,
  PORTAINJERTOS,
  POLINIZANTES_CONOCIDOS,
} from "@/constants/terreno.constants"
import { guardarInvplantaLocal } from "@/lib/terreno-db"
import type {
  CuartelOpcion,
  EstadoPlanta,
  Gps,
  PasoSecuencia,
  TipoPlanta,
} from "@/types/invplantas.types"
import {
  formatGps,
  generarCodigoBase,
  recalcularContadores,
} from "@/utils/invplantas.utils"

const capturarGps = (): Promise<Gps | null> =>
  new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          precision: p.coords.accuracy,
          hora: new Date().toISOString(),
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15000 },
    )
  })

// Quita el último paso del tipo indicado (deshacer la suma más reciente).
const quitarUltimo = (
  secuencia: PasoSecuencia[],
  tipo: TipoPlanta,
): PasoSecuencia[] => {
  const idx = secuencia.map((p) => p.tipo).lastIndexOf(tipo)
  if (idx === -1) return secuencia
  return [...secuencia.slice(0, idx), ...secuencia.slice(idx + 1)]
}

const metaInicial = {
  cuartelId: null as number | null,
  cuartel: "",
  variedad: "",
  portainjerto: "",
  polinizante: "",
  hilera: "",
}

export const InvplantasCapture = ({
  cuarteles,
  usuario,
}: {
  cuarteles: CuartelOpcion[]
  usuario: string
}) => {
  const [open, setOpen] = useState(false)
  const [paso, setPaso] = useState<"inicio" | "conteo">("inicio")
  const [meta, setMeta] = useState(metaInicial)
  const [inicio, setInicio] = useState("")
  const [gpsInicio, setGpsInicio] = useState<Gps | null>(null)
  const [secuencia, setSecuencia] = useState<PasoSecuencia[]>([])
  const [estado, setEstado] = useState<EstadoPlanta>("sano")
  const [ocupado, setOcupado] = useState(false)

  const cuartelItems = cuarteles.map((c) => ({
    value: String(c.id),
    label: c.nombre,
  }))
  const variedadBloqueada = Boolean(
    cuarteles.find((c) => c.id === meta.cuartelId)?.variedad,
  )
  const { countPrincipal, countPoliniz } = recalcularContadores(secuencia)

  const reset = () => {
    setPaso("inicio")
    setMeta(metaInicial)
    setInicio("")
    setGpsInicio(null)
    setSecuencia([])
    setEstado("sano")
  }

  const elegirCuartel = (id: string) => {
    const c = cuarteles.find((x) => String(x.id) === id)
    setMeta((m) => ({
      ...m,
      cuartelId: c ? c.id : null,
      cuartel: c?.nombre ?? "",
      variedad: c?.variedad || m.variedad,
    }))
  }

  const iniciar = async () => {
    if (meta.cuartelId === null) return toast.error("Selecciona un cuartel")
    if (!meta.variedad.trim()) return toast.error("Indica la variedad principal")
    if (!meta.hilera.trim()) return toast.error("Indica el N° de hilera")
    setOcupado(true)
    const pos = await capturarGps()
    setOcupado(false)
    if (!pos) toast.warning("Sin GPS de inicio: el mapa será menos preciso")
    setGpsInicio(pos)
    setInicio(new Date().toISOString())
    setPaso("conteo")
  }

  const contar = (tipo: TipoPlanta, delta: 1 | -1) => {
    setSecuencia((prev) =>
      delta > 0 ? [...prev, { tipo, estado }] : quitarUltimo(prev, tipo),
    )
  }

  const guardar = async () => {
    if (secuencia.length === 0) return toast.error("Cuenta al menos una planta")
    setOcupado(true)
    const gpsFin = await capturarGps()
    setOcupado(false)
    if (!gpsFin) toast.warning("Sin GPS de fin: el mapa será menos preciso")
    try {
      await guardarInvplantaLocal({
        id: crypto.randomUUID(),
        cuartelId: meta.cuartelId,
        cuartel: meta.cuartel,
        variedad: meta.variedad,
        portainjerto: meta.portainjerto,
        polinizante: meta.polinizante,
        hilera: meta.hilera,
        codigoBase: generarCodigoBase(meta.cuartel, meta.variedad, meta.hilera),
        usuario,
        secuencia,
        gpsInicio,
        gpsFin,
        fechaInicio: inicio,
        fechaFin: new Date().toISOString(),
      })
      toast.success("Hilera guardada en el dispositivo")
      // Preconfigura la siguiente hilera (index.html): mismo cuartel/variedad,
      // hilera +1, sin polinizante; vuelve al inicio para marcar GPS otra vez.
      const sig = Number.parseInt(meta.hilera.replace(/[^0-9]/g, ""), 10)
      setSecuencia([])
      setGpsInicio(null)
      setInicio("")
      setEstado("sano")
      setMeta((m) => ({
        ...m,
        polinizante: "",
        hilera: Number.isFinite(sig) ? String(sig + 1) : "",
      }))
      setPaso("inicio")
    } catch {
      setOcupado(false)
      toast.error("No se pudo guardar localmente. Reintenta.")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger render={<Button size="sm">Nueva hilera</Button>} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Inventario por hilera</DialogTitle>
          <DialogDescription>
            {paso === "inicio"
              ? "Selecciona el cuartel y la hilera para comenzar."
              : `${meta.cuartel} · ${meta.variedad || "—"} · Hilera ${meta.hilera}`}
          </DialogDescription>
        </DialogHeader>

        {paso === "inicio" ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Cuartel *</Label>
              <Select
                items={cuartelItems}
                value={meta.cuartelId === null ? "" : String(meta.cuartelId)}
                onValueChange={(v) => elegirCuartel(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {cuartelItems.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="variedad">Variedad principal *</Label>
                <Input
                  id="variedad"
                  value={meta.variedad}
                  readOnly={variedadBloqueada}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, variedad: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="hilera">N° de hilera *</Label>
                <Input
                  id="hilera"
                  inputMode="numeric"
                  value={meta.hilera}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, hilera: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="portainjerto">Portainjerto</Label>
                <Input
                  id="portainjerto"
                  list="portainjertos"
                  value={meta.portainjerto}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, portainjerto: e.target.value }))
                  }
                />
                <datalist id="portainjertos">
                  {PORTAINJERTOS.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="polinizante">Polinizante</Label>
                <Input
                  id="polinizante"
                  list="polinizantes"
                  value={meta.polinizante}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, polinizante: e.target.value }))
                  }
                />
                <datalist id="polinizantes">
                  {POLINIZANTES_CONOCIDOS.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={iniciar} disabled={ocupado}>
                {ocupado ? "Capturando GPS…" : "📍 Marcar inicio y comenzar"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Estado de la planta a sumar</Label>
              <div className="flex flex-wrap gap-2">
                {ESTADOS_PLANTA.map((e) => (
                  <button
                    key={e.value}
                    type="button"
                    onClick={() => setEstado(e.value)}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
                    style={{
                      backgroundColor: e.color,
                      outline:
                        estado === e.value ? "3px solid #1e293b" : "none",
                    }}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Contador
                titulo="🌳 Principal"
                valor={countPrincipal}
                color="#0a6ed1"
                onMas={() => contar("principal", 1)}
                onMenos={() => contar("principal", -1)}
              />
              <Contador
                titulo="🐝 Polinizante"
                valor={countPoliniz}
                color="#e9730c"
                onMas={() => contar("poliniz", 1)}
                onMenos={() => contar("poliniz", -1)}
              />
            </div>

            <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs">
              {secuencia.length} planta(s) · 🌳 {countPrincipal} · 🐝{" "}
              {countPoliniz}
              {gpsInicio && (
                <span className="ml-2 text-muted-foreground">
                  Inicio: {formatGps(gpsInicio.lat, gpsInicio.lng)}
                </span>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={reset}>
                Cancelar
              </Button>
              <Button type="button" onClick={guardar} disabled={ocupado}>
                {ocupado ? "Capturando GPS…" : "💾 Guardar y marcar fin"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

const Contador = ({
  titulo,
  valor,
  color,
  onMas,
  onMenos,
}: {
  titulo: string
  valor: number
  color: string
  onMas: () => void
  onMenos: () => void
}) => (
  <div className="flex flex-col items-center gap-2 rounded-md border p-3">
    <span className="text-sm font-medium">{titulo}</span>
    <span className="text-4xl font-bold tabular-nums">{valor}</span>
    <div className="flex w-full gap-2">
      <Button
        type="button"
        variant="outline"
        className="flex-1"
        onClick={onMenos}
      >
        −
      </Button>
      <Button
        type="button"
        className="flex-1 text-white"
        style={{ backgroundColor: color }}
        onClick={onMas}
      >
        +
      </Button>
    </div>
  </div>
)
