"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { empresaSchema } from "@/schemas/config.schema"
import { guardarEmpresa } from "@/server/config/config.actions"
import type { Empresa } from "@/types/config.types"

type EmpresaFormProps = {
  empresa: Empresa
  puedeEditar: boolean
}

export const EmpresaForm = ({ empresa, puedeEditar }: EmpresaFormProps) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState<Empresa>(empresa)

  const set = <K extends keyof Empresa>(key: K, value: Empresa[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const onLogo = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set("logo", String(reader.result))
    reader.readAsDataURL(file)
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsed = empresaSchema.safeParse(form)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = await guardarEmpresa(parsed.data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Datos de empresa actualizados")
      router.refresh()
    })
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Datos de la empresa</CardTitle>
        <CardDescription>
          Aparecen en documentos y reportes. El campo Nombre es obligatorio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                disabled={!puedeEditar}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rut">RUT</Label>
              <Input
                id="rut"
                value={form.rut}
                onChange={(e) => set("rut", e.target.value)}
                disabled={!puedeEditar}
                placeholder="76.123.456-7"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="giro">Giro</Label>
              <Input
                id="giro"
                value={form.giro}
                onChange={(e) => set("giro", e.target.value)}
                disabled={!puedeEditar}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={form.telefono}
                onChange={(e) => set("telefono", e.target.value)}
                disabled={!puedeEditar}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={form.direccion}
                onChange={(e) => set("direccion", e.target.value)}
                disabled={!puedeEditar}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="correo">Correo</Label>
              <Input
                id="correo"
                type="email"
                value={form.correo}
                onChange={(e) => set("correo", e.target.value)}
                disabled={!puedeEditar}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="logo">Logo</Label>
            {form.logo && (
              // eslint-disable-next-line @next/next/no-img-element -- logo en data URI (base64) desde config
              <img
                src={form.logo}
                alt="Logo"
                className="h-16 w-auto rounded border object-contain"
              />
            )}
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={(e) => onLogo(e.target.files?.[0])}
              disabled={!puedeEditar}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.recupIEC}
              onCheckedChange={(c) => set("recupIEC", c === true)}
              disabled={!puedeEditar}
            />
            Recupera IEC
          </label>
          {puedeEditar && (
            <div>
              <Button type="submit" disabled={pending}>
                {pending ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
