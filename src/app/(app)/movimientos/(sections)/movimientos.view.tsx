import {
  MOVIMIENTOS_SUBTITLE,
  MOVIMIENTOS_TITLE,
} from "@/constants/movimientos.constants"
import { getUsuarioActual } from "@/server/auth/auth.queries"
import { getMovimientos } from "@/server/movimientos/movimientos.queries"
import { can } from "@/utils/permisos.utils"
import { MovimientosTable } from "./movimientos.table"

export const MovimientosView = async () => {
  const [usuario, movimientos] = await Promise.all([
    getUsuarioActual(),
    getMovimientos(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">{MOVIMIENTOS_TITLE}</h1>
        <p className="text-muted-foreground">{MOVIMIENTOS_SUBTITLE}</p>
      </header>
      <MovimientosTable
        movimientos={movimientos}
        puedeCrear={can(usuario, "movimientos.crear")}
        puedeAnular={can(usuario, "movimientos.anular")}
      />
    </div>
  )
}
