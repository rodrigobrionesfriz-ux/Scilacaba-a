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
import { Textarea } from "@/components/ui/textarea"
import { grupoSchema } from "@/schemas/config.schema"
import { crearGrupo, editarGrupo } from "@/server/config/config.actions"
import type { Group } from "@/types/catalogos.types"
import { normalizarSubgrupos } from "@/utils/config.utils"

export const GrupoForm = ({ grupo }: { grupo?: Group }) => {
  const router = useRouter()
  const esEdicion = Boolean(grupo)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [nombre, setNombre] = useState(grupo?.nombre ?? "")
  const [subsRaw, setSubsRaw] = useState((grupo?.subgrupos ?? []).join("\n"))

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsed = grupoSchema.safeParse({
      nombre,
      subgrupos: normalizarSubgrupos(subsRaw),
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = grupo
        ? await editarGrupo(grupo.nombre, parsed.data)
        : await crearGrupo(parsed.data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(esEdicion ? "Grupo actualizado" : "Grupo creado")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          esEdicion ? (
            <Button variant="outline" size="sm">
              Editar
            </Button>
          ) : (
            <Button size="sm">Nuevo grupo</Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? `Editar ${grupo?.nombre}` : "Nuevo grupo"}
          </DialogTitle>
          <DialogDescription>
            Un subgrupo por línea. Se guardan en mayúsculas y sin duplicados.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="grupoNombre">Nombre *</Label>
            <Input
              id="grupoNombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={esEdicion}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="grupoSubs">Subgrupos</Label>
            <Textarea
              id="grupoSubs"
              rows={5}
              value={subsRaw}
              onChange={(e) => setSubsRaw(e.target.value)}
              placeholder={"FUNGICIDA\nHERBICIDA\n…"}
            />
          </div>
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
