import { notFound } from "next/navigation"
import { requirePermiso } from "@/server/auth/auth.queries"
import { getMovimiento } from "@/server/movimientos/movimientos.queries"
import { MovimientoDetalleView } from "../(sections)/movimientos.detalle"

const MovimientoPage = async ({
  params,
}: {
  params: Promise<{ numero: string }>
}) => {
  await requirePermiso("movimientos.ver")
  const { numero } = await params
  const movimiento = await getMovimiento(decodeURIComponent(numero))
  if (!movimiento) notFound()
  return <MovimientoDetalleView movimiento={movimiento} />
}

export default MovimientoPage
