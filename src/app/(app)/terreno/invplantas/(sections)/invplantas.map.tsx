"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ESTADOS_PLANTA,
  ESTADOS_PLANTA_VALUES,
  TIPOS_PLANTA,
} from "@/constants/terreno.constants"
import {
  editarEstadoPlanta,
  eliminarPlanta,
  insertarPlanta,
} from "@/server/invplantas/invplantas.actions"
import type {
  EstadoPlanta,
  InvplantaRow,
  PlantaCapturada,
  TipoPlanta,
} from "@/types/invplantas.types"
import type { ActionResult } from "@/types/action.types"
import { desgloseEstados } from "@/utils/invplantas.utils"

const colorEstado = (estado: EstadoPlanta) =>
  ESTADOS_PLANTA.find((e) => e.value === estado)?.color ?? "#999999"

// Narrowing del value del Select a EstadoPlanta sin `as` (regla 11).
const aEstado = (v: string | undefined): EstadoPlanta =>
  ESTADOS_PLANTA_VALUES.find((e) => e === v) ?? "sano"

const labelEstado = (estado: EstadoPlanta) =>
  ESTADOS_PLANTA.find((e) => e.value === estado)?.label ?? estado

export const InvplantasMapDialog = ({
  fila,
  puedeEditar,
}: {
  fila: InvplantaRow
  puedeEditar: boolean
}) => {
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState<PlantaCapturada | null>(null)
  const [posicion, setPosicion] = useState<"antes" | "despues">("despues")
  const [tipoNueva, setTipoNueva] = useState<TipoPlanta>("principal")
  const [estadoNueva, setEstadoNueva] = useState<EstadoPlanta>("sano")
  const [pending, startTransition] = useTransition()

  const estados = desgloseEstados(fila.plantas)

  const correr = (accion: () => Promise<ActionResult>, exito: string) =>
    startTransition(async () => {
      const res = await accion()
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(exito)
      setSel(null)
    })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setSel(null)
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            🗺️ Ver mapa
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{fila.codigoBase || "Hilera"}</DialogTitle>
          <DialogDescription>
            {fila.cuartel} · {fila.variedad} · Hilera {fila.hilera} ·{" "}
            {fila.plantas.length} plantas
            {fila.invertida && " · ↔️ orden invertido (hilera par)"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-3 text-xs">
          {ESTADOS_PLANTA.map((e) => (
            <span key={e.value} className="flex items-center gap-1">
              <span
                className="inline-block size-3 rounded-full"
                style={{ backgroundColor: e.color }}
              />
              {e.label} ({estados[e.value]})
            </span>
          ))}
        </div>

        {fila.plantas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Esta hilera no tiene plantas registradas.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {fila.plantas.map((p) => (
              <button
                key={p.seq}
                type="button"
                title={`${p.codigo} · ${p.tipo} · ${labelEstado(p.estado)}`}
                disabled={!puedeEditar || pending}
                onClick={() => puedeEditar && setSel(p)}
                className="flex size-11 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{
                  backgroundColor: colorEstado(p.estado),
                  border:
                    p.tipo === "poliniz"
                      ? "3px solid #e9730c"
                      : "2px solid rgba(0,0,0,.15)",
                  cursor: puedeEditar ? "pointer" : "default",
                  outline: sel?.seq === p.seq ? "3px solid #1e293b" : "none",
                }}
              >
                {p.seq}
              </button>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Borde gris = principal · borde naranja = polinizante · número =
          secuencia.
        </p>

        {puedeEditar && sel && (
          <div className="flex flex-col gap-3 rounded-md border p-3">
            <p className="text-sm font-medium">
              Planta #{sel.seq} · {sel.codigo}
            </p>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">
                Cambiar estado
              </span>
              <div className="flex flex-wrap gap-2">
                {ESTADOS_PLANTA.map((e) => (
                  <button
                    key={e.value}
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      correr(
                        () =>
                          editarEstadoPlanta({
                            id: fila.id,
                            seq: sel.seq,
                            estado: e.value,
                          }),
                        "Estado actualizado",
                      )
                    }
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
                    style={{ backgroundColor: e.color }}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <span className="w-full text-xs text-muted-foreground">
                Insertar planta
              </span>
              <Select
                items={[
                  { value: "antes", label: "Antes" },
                  { value: "despues", label: "Después" },
                ]}
                value={posicion}
                onValueChange={(v) =>
                  setPosicion(v === "antes" ? "antes" : "despues")
                }
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="antes">Antes</SelectItem>
                  <SelectItem value="despues">Después</SelectItem>
                </SelectContent>
              </Select>
              <Select
                items={TIPOS_PLANTA.map((t) => ({ value: t, label: t }))}
                value={tipoNueva}
                onValueChange={(v) =>
                  setTipoNueva(v === "poliniz" ? "poliniz" : "principal")
                }
              >
                <SelectTrigger className="w-32 capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PLANTA.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                items={ESTADOS_PLANTA.map((e) => ({
                  value: e.value,
                  label: e.label,
                }))}
                value={estadoNueva}
                onValueChange={(v) => setEstadoNueva(aEstado(v ?? undefined))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_PLANTA.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() =>
                  correr(
                    () =>
                      insertarPlanta({
                        id: fila.id,
                        seq: sel.seq,
                        posicion,
                        tipo: tipoNueva,
                        estado: estadoNueva,
                      }),
                    "Planta insertada",
                  )
                }
              >
                Insertar
              </Button>
            </div>

            <div className="flex justify-between gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSel(null)}
              >
                Cerrar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={pending}
                onClick={() =>
                  correr(
                    () => eliminarPlanta({ id: fila.id, seq: sel.seq }),
                    "Planta eliminada",
                  )
                }
              >
                Eliminar planta
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
