import { TOMAS_SUBTITLE, TOMAS_TITLE } from "@/constants/tomas.constants"
import { getUsuarioActual } from "@/server/auth/auth.queries"
import { getBodegas } from "@/server/bodegas/bodegas.queries"
import { getGroups, getProductTypes } from "@/server/catalogos/catalogos.queries"
import { getTomas } from "@/server/tomas/tomas.queries"
import { can } from "@/utils/permisos.utils"
import { TomasTable } from "./tomas.table"

export const TomasView = async () => {
  const [usuario, tomas, bodegas, grupos, tipos] = await Promise.all([
    getUsuarioActual(),
    getTomas(),
    getBodegas(),
    getGroups(),
    getProductTypes(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">{TOMAS_TITLE}</h1>
        <p className="text-muted-foreground">{TOMAS_SUBTITLE}</p>
      </header>
      <TomasTable
        tomas={tomas}
        puedeCrear={can(usuario, "tomas.crear")}
        bodegas={bodegas}
        grupos={grupos.map((g) => g.nombre)}
        tipos={tipos.map((t) => t.nombre)}
      />
    </div>
  )
}
