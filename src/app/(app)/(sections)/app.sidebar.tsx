"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV } from "@/constants/navegacion.constants"
import { cn } from "@/lib/utils"
import { itemVisible } from "@/utils/permisos.utils"

type Props = { role: string; permissions: readonly string[] }

export const AppSidebar = ({ role, permissions }: Props) => {
  const pathname = usePathname()
  const usuario = { role, permissions }
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <span className="text-lg" aria-hidden>
          🍒
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">SCI v2</p>
          <p className="text-xs text-muted-foreground">Scilacaba</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {NAV.map((seccion) => {
          const items = seccion.items.filter((item) =>
            itemVisible(usuario, item),
          )
          if (items.length === 0) return null
          return (
            <div key={seccion.section} className="mb-3">
              <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {seccion.section}
              </p>
              <ul className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const Icon = item.icon
                  if (!item.disponible) {
                    return (
                      <li key={item.id}>
                        <span
                          className="flex cursor-not-allowed items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground/50"
                          title="Disponible próximamente"
                        >
                          <Icon className="size-4" />
                          {item.label}
                        </span>
                      </li>
                    )
                  }
                  const activo = pathname === item.href
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                          activo &&
                            "bg-accent font-medium text-accent-foreground",
                        )}
                      >
                        <Icon className="size-4" />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
