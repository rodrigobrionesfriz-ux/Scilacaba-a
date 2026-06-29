"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { TABS_FERTIRRIEGO } from "@/constants/fertirriego.constants"
import { cn } from "@/lib/utils"

export const FertirriegoSubtabs = () => {
  const pathname = usePathname()
  return (
    <nav className="flex flex-wrap gap-1 rounded-md bg-muted p-1">
      {TABS_FERTIRRIEGO.map((tab) => {
        const activo = pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
              activo && "bg-background font-medium text-foreground shadow-sm",
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
