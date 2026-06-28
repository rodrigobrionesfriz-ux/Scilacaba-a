import {
  BODEGAS_SUBTITLE,
  BODEGAS_TITLE,
} from "@/constants/bodegas.constants"
import { getUsuarioActual } from "@/server/auth/auth.queries"
import { getBodegas } from "@/server/bodegas/bodegas.queries"
import { getStockResumenPorBodega } from "@/server/stock/stock.queries"
import { can } from "@/utils/permisos.utils"
import { BodegasTable } from "./bodegas.table"

export const BodegasView = async () => {
  const [usuario, bodegas, resumen] = await Promise.all([
    getUsuarioActual(),
    getBodegas(),
    getStockResumenPorBodega(),
  ])
  const stockPorBodega = new Map(resumen.map((r) => [r.bodegaId, r]))

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">{BODEGAS_TITLE}</h1>
        <p className="text-muted-foreground">{BODEGAS_SUBTITLE}</p>
      </header>
      <BodegasTable
        bodegas={bodegas}
        stockPorBodega={stockPorBodega}
        puedeCrear={can(usuario, "bodegas.crear")}
      />
    </div>
  )
}
