"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  conteosPendientes,
  eliminarConteoLocal,
  listarConteosLocales,
  marcarSincronizados,
} from "@/lib/terreno-db"
import { sincronizarConteos } from "@/server/conteos/conteos.actions"

const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })

export const ConteosLocalList = () => {
  const locales = useLiveQuery(() => listarConteosLocales(), [])
  const [online, setOnline] = useState(true)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const set = () => setOnline(navigator.onLine)
    set()
    window.addEventListener("online", set)
    window.addEventListener("offline", set)
    return () => {
      window.removeEventListener("online", set)
      window.removeEventListener("offline", set)
    }
  }, [])

  const pendientes = (locales ?? []).filter((c) => !c.sincronizado).length

  const subir = () =>
    startTransition(async () => {
      const pend = await conteosPendientes()
      if (pend.length === 0) {
        toast.info("No hay conteos pendientes")
        return
      }
      const res = await sincronizarConteos(pend)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      await marcarSincronizados(res.ids, new Date().toISOString())
      toast.success(`${res.ids.length} conteo(s) sincronizados`)
    })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`size-2 rounded-full ${online ? "bg-green-600" : "bg-red-500"}`}
            aria-hidden
          />
          <span className="text-muted-foreground">
            {online ? "Conectado" : "Sin conexión"}
            {pendientes > 0 && ` · ${pendientes} por subir`}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={subir}
          disabled={!online || pending || pendientes === 0}
        >
          {pending ? "Subiendo…" : "☁️ Subir a la nube"}
        </Button>
      </div>

      {locales === undefined ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : locales.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Sin conteos en este dispositivo. Inicia uno con “Nuevo conteo”.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {locales.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {c.panoNombre || "—"}{" "}
                  <span className="font-normal text-muted-foreground">
                    {c.variedad}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.nArboles} árbol(es) · prom {c.promedioCentros.toFixed(1)} ·{" "}
                  {fechaCorta(c.fechaInicio)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={c.sincronizado ? "secondary" : "outline"}>
                  {c.sincronizado ? "☁️ Sincronizado" : "📱 Local"}
                </Badge>
                {c.sincronizado && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => eliminarConteoLocal(c.id)}
                  >
                    Quitar
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
