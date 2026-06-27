import {
  CENTROS_COSTO_SUBTITLE,
  CENTROS_COSTO_TITLE,
} from "@/constants/centros-costo.constants"
import { getUsuarioActual } from "@/server/auth/auth.queries"
import {
  getAreas,
  getCentrosCosto,
} from "@/server/centros-costo/centros-costo.queries"
import { can } from "@/utils/permisos.utils"
import { CentrosCostoTable } from "./centros-costo.table"

export const CentrosCostoView = async () => {
  const [usuario, centros, areas] = await Promise.all([
    getUsuarioActual(),
    getCentrosCosto(),
    getAreas(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">{CENTROS_COSTO_TITLE}</h1>
        <p className="text-muted-foreground">{CENTROS_COSTO_SUBTITLE}</p>
      </header>
      <CentrosCostoTable
        centros={centros}
        areas={areas}
        puedeCrear={can(usuario, "centrosCosto.crear")}
      />
    </div>
  )
}
