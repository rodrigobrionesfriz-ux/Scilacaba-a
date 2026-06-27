"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { EntidadComercialFields } from "@/components/entidad-comercial-fields"
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
import { type Cliente, clienteSchema } from "@/schemas/clientes.schema"
import { crearCliente, editarCliente } from "@/server/clientes/clientes.actions"

const estadoInicial = (c?: Cliente): Cliente => ({
  codigo: c?.codigo ?? "",
  razonSocial: c?.razonSocial ?? "",
  rut: c?.rut ?? "",
  giro: c?.giro ?? "",
  direccion: c?.direccion ?? "",
  comuna: c?.comuna ?? "",
  ciudad: c?.ciudad ?? "",
  telefono: c?.telefono ?? "",
  email: c?.email ?? "",
  contacto: c?.contacto ?? "",
  activo: c?.activo ?? true,
})

export const ClienteForm = ({ cliente }: { cliente?: Cliente }) => {
  const router = useRouter()
  const esEdicion = Boolean(cliente)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(estadoInicial(cliente))

  const set = <K extends keyof Cliente>(key: K, value: Cliente[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsed = clienteSchema.safeParse(form)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = cliente
        ? await editarCliente(cliente.codigo, parsed.data)
        : await crearCliente(parsed.data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(esEdicion ? "Cliente actualizado" : "Cliente creado")
      setOpen(false)
      if (!esEdicion) setForm(estadoInicial())
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
            <Button size="sm">Nuevo cliente</Button>
          )
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? `Editar ${cliente?.codigo}` : "Nuevo cliente"}
          </DialogTitle>
          <DialogDescription>
            Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <EntidadComercialFields form={form} set={set} esEdicion={esEdicion} />
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
