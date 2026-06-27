"use client"

import { ChevronDown, KeyRound, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ROLE_LABELS } from "@/constants/permisos.constants"
import { signOut } from "@/lib/auth-client"

type Props = { nombre: string; email: string; role: string }

const iniciales = (nombre: string) =>
  nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("")

export const AppTopbar = ({ nombre, email, role }: Props) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const rolLabel = ROLE_LABELS[role] ?? role

  const cerrarSesion = () =>
    startTransition(async () => {
      await signOut()
      router.push("/login")
      router.refresh()
    })

  return (
    <header className="flex h-14 items-center justify-end border-b px-4">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" className="h-auto gap-2 px-2 py-1" />}
        >
          <Avatar className="size-7">
            <AvatarFallback className="text-xs">
              {iniciales(nombre)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">{nombre}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="font-medium">{nombre}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {email}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {rolLabel}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/cambiar-password" />}>
            <KeyRound className="size-4" />
            Cambiar contraseña
          </DropdownMenuItem>
          <DropdownMenuItem disabled={pending} onClick={cerrarSesion}>
            <LogOut className="size-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
