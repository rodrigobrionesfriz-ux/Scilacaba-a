"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV } from "@/constants/navegacion.constants"
import { cn } from "@/lib/utils"
import { itemVisible } from "@/utils/permisos.utils"

type Props = {
  role: string
  permissions: readonly string[]
  onNavigate?: () => void
}

export const AppNav = ({ role, permissions, onNavigate }: Props) => {
  const pathname = usePathname()
  const usuario = { role, permissions }
  return (
    <nav className="flex-1 overflow-y-auto p-2">
      {NAV.map((seccion) => {
        const items = seccion.items.filter((item) => itemVisible(usuario, item))
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
                        className="flex cursor-not-allowed items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground/50"
                        title="Disponible próximamente"
                      >
                        <Icon className="size-4" />
                        {item.label}
                      </span>
                    </li>
                  )
                }
                const activo =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
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
  )
}
