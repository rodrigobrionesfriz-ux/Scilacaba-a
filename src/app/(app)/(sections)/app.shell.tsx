"use client"

import { useState } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { AppNav } from "./app.nav"
import { AppSidebar } from "./app.sidebar"
import { AppTopbar } from "./app.topbar"

type Usuario = {
  nombre: string
  email: string
  role: string
  permissions: readonly string[]
}

export const AppShell = ({
  usuario,
  children,
}: {
  usuario: Usuario
  children: React.ReactNode
}) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <AppSidebar role={usuario.role} permissions={usuario.permissions} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar
          nombre={usuario.nombre}
          email={usuario.email}
          role={usuario.role}
          onOpenMenu={() => setOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="md:hidden">
          <div className="flex h-14 items-center gap-2 border-b px-4">
            <p className="text-sm font-semibold">SCI</p>
            <p className="text-xs text-muted-foreground">La Cabaña Forestal</p>
          </div>
          <AppNav
            role={usuario.role}
            permissions={usuario.permissions}
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
