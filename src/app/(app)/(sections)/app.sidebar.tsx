"use client"

import Image from "next/image"
import { AppNav } from "./app.nav"

type Props = { role: string; permissions: readonly string[] }

export const AppSidebar = ({ role, permissions }: Props) => (
  <aside className="hidden w-60 shrink-0 flex-col border-r bg-card md:flex">
    <div className="flex h-14 items-center gap-2 border-b px-4">
      <Image
        src="/logo-la-cabana.png"
        alt="La Cabaña Forestal"
        width={36}
        height={36}
        className="h-9 w-9 shrink-0"
        priority
      />
      <div className="leading-tight">
        <p className="text-sm font-semibold">SCI</p>
        <p className="text-xs text-muted-foreground">La Cabaña Forestal</p>
      </div>
    </div>
    <AppNav role={role} permissions={permissions} />
  </aside>
)
