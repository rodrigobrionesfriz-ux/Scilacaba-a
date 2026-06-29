"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { configFertSchema } from "@/schemas/fertirriego-config.schema"
import { guardarConfigFert } from "@/server/fertirriego-config/fertirriego-config.actions"
import type { ConfigFert, PredioFert, RangoFert } from "@/types/fertirriego.types"
import { ListaEditable } from "./parametros.lista"

type ParametrosFormProps = {
  config: ConfigFert
  puedeEditar: boolean
}

export const ParametrosForm = ({ config, puedeEditar }: ParametrosFormProps) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [cfg, setCfg] = useState<ConfigFert>(config)

  const set = <K extends keyof ConfigFert>(key: K, value: ConfigFert[K]) =>
    setCfg((prev) => ({ ...prev, [key]: value }))

  const setRango = (i: number, campo: keyof RangoFert, value: string) =>
    setCfg((prev) => ({
      ...prev,
      rangos: prev.rangos.map((r, idx) =>
        idx === i
          ? { ...r, [campo]: campo === "especie" ? value : Number(value) || 0 }
          : r,
      ),
    }))

  const setPredio = (i: number, campo: keyof PredioFert, value: string) =>
    setCfg((prev) => ({
      ...prev,
      predios: prev.predios.map((p, idx) =>
        idx === i ? { ...p, [campo]: value } : p,
      ),
    }))

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsed = configFertSchema.safeParse(cfg)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = await guardarConfigFert(parsed.data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Parámetros guardados")
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="empresa">Empresa</Label>
          <Input
            id="empresa"
            value={cfg.empresa}
            disabled={!puedeEditar}
            onChange={(e) => set("empresa", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="temporada">Temporada</Label>
          <Input
            id="temporada"
            value={cfg.temporada}
            disabled={!puedeEditar}
            onChange={(e) => set("temporada", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="documento">Documento</Label>
          <Input
            id="documento"
            value={cfg.documento}
            disabled={!puedeEditar}
            onChange={(e) => set("documento", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="obsDefecto">Observación por defecto</Label>
          <Input
            id="obsDefecto"
            value={cfg.obsDefecto}
            disabled={!puedeEditar}
            onChange={(e) => set("obsDefecto", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ListaEditable
          label="Formas de aplicación"
          valores={cfg.formas}
          disabled={!puedeEditar}
          onChange={(v) => set("formas", v)}
        />
        <ListaEditable
          label="Horarios"
          valores={cfg.horarios}
          disabled={!puedeEditar}
          onChange={(v) => set("horarios", v)}
        />
        <ListaEditable
          label="Unidades"
          valores={cfg.unidades}
          disabled={!puedeEditar}
          onChange={(v) => set("unidades", v)}
        />
        <ListaEditable
          label="Equipos"
          valores={cfg.equipos}
          disabled={!puedeEditar}
          onChange={(v) => set("equipos", v)}
        />
        <ListaEditable
          label="Condiciones"
          valores={cfg.condiciones}
          disabled={!puedeEditar}
          onChange={(v) => set("condiciones", v)}
        />
        <ListaEditable
          label="Tipos de documento"
          valores={cfg.tiposDoc}
          disabled={!puedeEditar}
          onChange={(v) => set("tiposDoc", v)}
        />
      </div>

      <ListaEditable
        label="Estados fenológicos"
        valores={cfg.estados}
        disabled={!puedeEditar}
        onChange={(v) => set("estados", v)}
      />

      {/* Rangos de numeración por especie */}
      <fieldset className="flex flex-col gap-2 rounded-md border p-3">
        <legend className="px-1 text-sm font-medium">
          Rangos de numeración
        </legend>
        {cfg.rangos.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-2">
            <Input
              value={r.especie}
              disabled={!puedeEditar}
              onChange={(e) => setRango(i, "especie", e.target.value)}
              placeholder="Especie"
            />
            <Input
              className="w-24"
              type="number"
              value={String(r.desde)}
              disabled={!puedeEditar}
              onChange={(e) => setRango(i, "desde", e.target.value)}
              placeholder="Desde"
            />
            <Input
              className="w-24"
              type="number"
              value={String(r.hasta)}
              disabled={!puedeEditar}
              onChange={(e) => setRango(i, "hasta", e.target.value)}
              placeholder="Hasta"
            />
            {puedeEditar && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  set(
                    "rangos",
                    cfg.rangos.filter((_, idx) => idx !== i),
                  )
                }
              >
                ✕
              </Button>
            )}
          </div>
        ))}
        {puedeEditar && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() =>
              set("rangos", [
                ...cfg.rangos,
                { especie: "", desde: 0, hasta: 0 },
              ])
            }
          >
            + Añadir rango
          </Button>
        )}
      </fieldset>

      {/* Predios y administradores */}
      <fieldset className="flex flex-col gap-2 rounded-md border p-3">
        <legend className="px-1 text-sm font-medium">Predios</legend>
        {cfg.predios.map((p, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <Input
              value={p.predio}
              disabled={!puedeEditar}
              onChange={(e) => setPredio(i, "predio", e.target.value)}
              placeholder="Predio"
            />
            <Input
              value={p.admin}
              disabled={!puedeEditar}
              onChange={(e) => setPredio(i, "admin", e.target.value)}
              placeholder="Administrador"
            />
            {puedeEditar && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  set(
                    "predios",
                    cfg.predios.filter((_, idx) => idx !== i),
                  )
                }
              >
                ✕
              </Button>
            )}
          </div>
        ))}
        {puedeEditar && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() =>
              set("predios", [...cfg.predios, { predio: "", admin: "" }])
            }
          >
            + Añadir predio
          </Button>
        )}
      </fieldset>

      {puedeEditar && (
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar parámetros"}
          </Button>
        </div>
      )}
    </form>
  )
}
