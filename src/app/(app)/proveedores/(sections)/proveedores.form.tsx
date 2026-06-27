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
import { type Proveedor, proveedorSchema } from "@/schemas/proveedores.schema"
import {
  crearProveedor,
  editarProveedor,
} from "@/server/proveedores/proveedores.actions"

const estadoInicial = (p?: Proveedor): Proveedor => ({
  codigo: p?.codigo ?? "",
  razonSocial: p?.razonSocial ?? "",
  rut: p?.rut ?? "",
  giro: p?.giro ?? "",
  direccion: p?.direccion ?? "",
  comuna: p?.comuna ?? "",
  ciudad: p?.ciudad ?? "",
  telefono: p?.telefono ?? "",
  email: p?.email ?? "",
  contacto: p?.contacto ?? "",
  activo: p?.activo ?? true,
})

export const ProveedorForm = ({ proveedor }: { proveedor?: Proveedor }) => {
  const router = useRouter()
  const esEdicion = Boolean(proveedor)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(estadoInicial(proveedor))

  const set = <K extends keyof Proveedor>(key: K, value: Proveedor[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsed = proveedorSchema.safeParse(form)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = proveedor
        ? await editarProveedor(proveedor.codigo, parsed.data)
        : await crearProveedor(parsed.data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(esEdicion ? "Proveedor actualizado" : "Proveedor creado")
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
            <Button size="sm">Nuevo proveedor</Button>
          )
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? `Editar ${proveedor?.codigo}` : "Nuevo proveedor"}
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
