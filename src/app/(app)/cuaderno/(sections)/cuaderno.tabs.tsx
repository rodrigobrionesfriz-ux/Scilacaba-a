"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { TABS_CUADERNO } from "@/constants/cuaderno.constants"
import { cn } from "@/lib/utils"

export const CuadernoTabs = () => {
  const pathname = usePathname()
  return (
    <nav className="flex gap-1 border-b">
      {TABS_CUADERNO.map((tab) => {
        const activo =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "-mb-px border-b-2 border-transparent px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
              activo && "border-primary font-medium text-foreground",
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
