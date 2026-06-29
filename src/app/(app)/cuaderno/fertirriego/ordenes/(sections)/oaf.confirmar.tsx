"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { confirmarOaf, desconfirmarOaf } from "@/server/oaf/oaf.actions"
import type { OafRow } from "@/types/fertirriego.types"

// Toggle de confirmación (fiel al monolito): confirmar marca fecha; desconfirmar
// la limpia. No genera entidad aparte ni recalcula cantidades.
export const OafConfirmar = ({ orden }: { orden: OafRow }) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const onToggle = () =>
    startTransition(async () => {
      const res = orden.confirmada
        ? await desconfirmarOaf(orden.id)
        : await confirmarOaf(orden.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(orden.confirmada ? "Orden reabierta" : "Orden confirmada")
      router.refresh()
    })

  return (
    <Button variant="ghost" size="sm" onClick={onToggle} disabled={pending}>
      {orden.confirmada ? "Reabrir" : "Confirmar"}
    </Button>
  )
}
