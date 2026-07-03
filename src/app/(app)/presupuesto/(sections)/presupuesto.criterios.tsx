"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TIPOS_GASTO_CRITERIO } from "@/constants/presupuesto.constants"
import {
  eliminarCriterio,
  guardarCriterio,
} from "@/server/presupuesto/presupuesto.actions"
import type { Criterio } from "@/types/presupuesto.types"

type PresupuestoCriteriosProps = {
  criterios: Criterio[]
  temporadas: string[]
  puedeEditar: boolean
}

const TODAS = "__todas__"

export const PresupuestoCriterios = ({
  criterios,
  temporadas,
  puedeEditar,
}: PresupuestoCriteriosProps) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editId, setEditId] = useState<string | null>(null)
  const [temporada, setTemporada] = useState("")
  const [tipo, setTipo] = useState("")
  const [detalle, setDetalle] = useState("")
  const [filtro, setFiltro] = useState("")

  // Temporadas del select: las del presupuesto + las ya usadas en criterios.
  const opcionesTemporada = useMemo(
    () =>
      [...new Set([...temporadas, ...criterios.map((c) => c.temporada)])]
        .filter(Boolean)
        .sort(),
    [temporadas, criterios],
  )
  const tiposItems = TIPOS_GASTO_CRITERIO.map((t) => ({ value: t, label: t }))
  const temporadaItems = opcionesTemporada.map((t) => ({ value: t, label: t }))

  const limpiar = () => {
    setEditId(null)
    setTemporada("")
    setTipo("")
    setDetalle("")
  }

  const onGuardar = () =>
    startTransition(async () => {
      const res = await guardarCriterio({
        ...(editId ? { id: editId } : {}),
        temporada,
        tipo,
        detalle,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(editId ? "Criterio actualizado" : "Criterio guardado")
      limpiar()
      router.refresh()
    })

  const onEditar = (c: Criterio) => {
    setEditId(c.id)
    setTemporada(c.temporada)
    setTipo(c.tipo)
    setDetalle(c.detalle)
  }

  const onEliminar = (id: string) =>
    startTransition(async () => {
      const res = await eliminarCriterio(id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Criterio eliminado")
      if (editId === id) limpiar()
      router.refresh()
    })

  const filtrados = filtro
    ? criterios.filter((c) => c.temporada === filtro)
    : criterios
  const porTemporada = useMemo(() => {
    const mapa = new Map<string, Criterio[]>()
    const ordenados = [...filtrados].sort(
      (a, b) =>
        b.temporada.localeCompare(a.temporada) || b.fecha.localeCompare(a.fecha),
    )
    for (const c of ordenados) {
      const arr = mapa.get(c.temporada) ?? []
      arr.push(c)
      mapa.set(c.temporada, arr)
    }
    return [...mapa.entries()]
  }, [filtrados])

  return (
    <div className="flex flex-col gap-6 pt-4">
      {puedeEditar && (
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Temporada</Label>
                <Select
                  items={temporadaItems}
                  value={temporada}
                  onValueChange={(v) => setTemporada(v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    {temporadaItems.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Tipo de gasto / evento</Label>
                <Select
                  items={tiposItems}
                  value={tipo}
                  onValueChange={(v) => setTipo(v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposItems.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Detalle del criterio</Label>
              <Textarea
                rows={4}
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                placeholder="Describa el criterio: tipo de poda, valores del trato, % contratista, estrategia de nutrición, labores de M.O., etc."
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={onGuardar} disabled={pending}>
                {pending
                  ? "Guardando…"
                  : editId
                    ? "Actualizar criterio"
                    : "Guardar criterio"}
              </Button>
              {editId && (
                <Button type="button" variant="ghost" onClick={limpiar}>
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <Label className="text-sm">Filtrar por temporada:</Label>
        <Select
          items={[
            { value: TODAS, label: "Todas" },
            ...temporadaItems,
          ]}
          value={filtro === "" ? TODAS : filtro}
          onValueChange={(v) => setFiltro(v === TODAS ? "" : (v ?? ""))}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas</SelectItem>
            {temporadaItems.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {porTemporada.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay criterios registrados.
        </p>
      ) : (
        porTemporada.map(([temp, items]) => (
          <div key={temp} className="flex flex-col gap-2">
            <h3 className="border-b pb-1 text-sm font-bold">
              📅 Temporada {temp}
            </h3>
            {items.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex flex-col gap-2 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">
                      {c.tipo}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {c.usuario}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{c.detalle}</p>
                  {puedeEditar && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onEditar(c)}
                      >
                        Editar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button size="sm" variant="ghost">
                              Eliminar
                            </Button>
                          }
                        />
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Eliminar criterio
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. ¿Eliminar este
                              criterio de {c.temporada}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => onEliminar(c.id)}
                              disabled={pending}
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
