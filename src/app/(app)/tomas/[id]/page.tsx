import { notFound } from "next/navigation"
import { getUsuarioActual, requirePermiso } from "@/server/auth/auth.queries"
import { getToma } from "@/server/tomas/tomas.queries"
import { TomaDetalleView } from "../(sections)/tomas.detalle"

const TomaPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  await requirePermiso("tomas.ver")
  const { id } = await params
  const [toma, usuario] = await Promise.all([
    getToma(decodeURIComponent(id)),
    getUsuarioActual(),
  ])
  if (!toma) notFound()
  return <TomaDetalleView toma={toma} usuario={usuario} />
}

export default TomaPage
