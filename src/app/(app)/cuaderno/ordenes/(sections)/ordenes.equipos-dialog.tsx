"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  crearEquipo,
  eliminarEquipo,
} from "@/server/equipos/equipos.actions"
import type { EquipoRow } from "@/types/equipos.types"

type EquiposDialogProps = { equipos: EquipoRow[] }

export const EquiposDialog = ({ equipos }: EquiposDialogProps) => {
  const [nombre, setNombre] = useState("")
  const [capacidad, setCapacidad] = useState("")
  const [pending, startTransition] = useTransition()

  const agregar = () => {
    startTransition(async () => {
      const res = await crearEquipo({ nombre, capacidad })
      if (res.ok) {
        toast.success("Nebulizadora creada")
        setNombre("")
        setCapacidad("")
      } else toast.error(res.error)
    })
  }

  const borrar = (id: number) => {
    startTransition(async () => {
      const res = await eliminarEquipo(id)
      if (res.ok) toast.success("Nebulizadora eliminada")
      else toast.error(res.error)
    })
  }

  return (
    <Dialog>
      <DialogTrigger
        render={<Button type="button" variant="secondary" size="sm" nativeButton={false} />}
      >
        Gestionar nebulizadoras
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nebulizadoras</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {equipos.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-2">
              <span className="text-sm">
                {e.nombre} · {e.capacidad} L
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => borrar(e.id)}
              >
                Eliminar
              </Button>
            </div>
          ))}
          <div className="mt-2 flex gap-2">
            <Input
              placeholder="Nombre"
              value={nombre}
              onChange={(ev) => setNombre(ev.target.value)}
            />
            <Input
              type="number"
              placeholder="Capacidad (L)"
              value={capacidad}
              onChange={(ev) => setCapacidad(ev.target.value)}
            />
            <Button type="button" disabled={pending} onClick={agregar}>
              Agregar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
