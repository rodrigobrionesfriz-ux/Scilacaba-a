"use client"

import { useEffect, useState } from "react"
import { MOBILE_BREAKPOINT } from "@/constants/responsive.constants"

// Devuelve true cuando el viewport es < MOBILE_BREAKPOINT. SSR-safe: false en el
// server y en el primer render del cliente (evita mismatch de hidratación), se
// sincroniza tras montar y ante cambios de tamaño.
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(mql.matches)
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
