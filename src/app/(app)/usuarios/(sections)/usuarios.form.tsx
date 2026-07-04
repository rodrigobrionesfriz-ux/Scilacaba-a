"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { PERMISOS, ROLE_LABELS, ROLE_PERMS, ROLES } from "@/constants/permisos.constants"
import {
  crearUsuarioSchema,
  editarUsuarioSchema,
} from "@/schemas/usuarios.schema"
import { crearUsuario, editarUsuario } from "@/server/usuarios/usuarios.actions"
import type { UsuarioRow } from "@/types/usuarios.types"
import { permisosDeRol } from "@/utils/usuarios.utils"

const roleItems = ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] ?? r }))

export const UsuarioForm = ({ usuario }: { usuario?: UsuarioRow }) => {
  const router = useRouter()
  const esEdicion = Boolean(usuario)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [nombre, setNombre] = useState(usuario?.nombre ?? "")
  const [username, setUsername] = useState(usuario?.username ?? "")
  const [role, setRole] = useState(usuario?.role ?? "consulta")
  const [password, setPassword] = useState("")
  const [activo, setActivo] = useState(usuario?.activo ?? true)
  const [permisos, setPermisos] = useState<string[]>(
    usuario?.permissions ?? permisosDeRol(ROLE_PERMS, "consulta"),
  )

  const cambiarRole = (v: string | null) => {
    const val = v ?? role
    setRole(val)
    setPermisos(permisosDeRol(ROLE_PERMS, val))
  }

  const toggle = (clave: string, on: boolean) =>
    setPermisos((prev) =>
      on ? [...new Set([...prev, clave])] : prev.filter((p) => p !== clave),
    )

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (esEdicion && usuario) {
      const parsed = editarUsuarioSchema.safeParse({
        nombre,
        role,
        permissions: permisos,
        activo,
      })
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
        return
      }
      startTransition(async () => {
        const res = await editarUsuario(usuario.id, parsed.data)
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success("Usuario actualizado")
        setOpen(false)
        router.refresh()
      })
      return
    }
    const parsed = crearUsuarioSchema.safeParse({
      nombre,
      username,
      role,
      permissions: permisos,
      password,
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = await crearUsuario(parsed.data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Usuario creado")
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
            <Button size="sm">Nuevo usuario</Button>
          )
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? `Editar ${usuario?.nombre}` : "Nuevo usuario"}
          </DialogTitle>
          <DialogDescription>
            El rol precarga sus permisos; puedes ajustarlos manualmente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="usNombre">Nombre *</Label>
            <Input
              id="usNombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          {!esEdicion && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="usUsername">Usuario *</Label>
                <Input
                  id="usUsername"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="usPassword">Contraseña inicial *</Label>
                <Input
                  id="usPassword"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}
          <div className="flex flex-col gap-2">
            <Label>Rol</Label>
            <Select items={roleItems} value={role} onValueChange={cambiarRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleItems.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {esEdicion && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={activo}
                onCheckedChange={(c) => setActivo(c === true)}
              />
              Activo
            </label>
          )}
          <div className="flex flex-col gap-2">
            <Label>Permisos</Label>
            <div className="grid max-h-56 grid-cols-1 gap-1.5 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
              {PERMISOS.map(([clave, etiqueta]) => (
                <label key={clave} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={permisos.includes(clave)}
                    onCheckedChange={(c) => toggle(clave, c === true)}
                  />
                  {etiqueta}
                </label>
              ))}
            </div>
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
