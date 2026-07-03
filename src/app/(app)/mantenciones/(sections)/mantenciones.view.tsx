import { ExportarExcel } from "@/components/ui/exportar-excel"
import {
  MANTENCIONES_SUBTITLE,
  MANTENCIONES_TITLE,
} from "@/constants/mantenciones.constants"
import { getUsuarioActual } from "@/server/auth/auth.queries"
import { exportarMantencionesExcel } from "@/server/mantenciones/mantenciones.actions"
import {
  getMantenciones,
  getProductosServicio,
} from "@/server/mantenciones/mantenciones.queries"
import { getProveedores } from "@/server/proveedores/proveedores.queries"
import { can } from "@/utils/permisos.utils"
import { MantencionesKpis } from "./mantenciones.kpis"
import { MantencionesTable } from "./mantenciones.table"

export const MantencionesView = async () => {
  const [usuario, { rows, kpis }, proveedores, productos] = await Promise.all([
    getUsuarioActual(),
    getMantenciones(),
    getProveedores(),
    getProductosServicio(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{MANTENCIONES_TITLE}</h1>
          <p className="text-muted-foreground">{MANTENCIONES_SUBTITLE}</p>
        </div>
        <ExportarExcel action={exportarMantencionesExcel} />
      </header>
      <MantencionesKpis kpis={kpis} />
      <MantencionesTable
        ordenes={rows}
        proveedores={proveedores
          .filter((p) => p.activo)
          .map((p) => ({ codigo: p.codigo, nombre: p.razonSocial }))}
        productos={productos}
        puedeCrear={can(usuario, "mantenciones.crear")}
        puedeFacturar={can(usuario, "mantenciones.facturar")}
        puedeEliminar={can(usuario, "mantenciones.eliminar")}
      />
    </div>
  )
}
