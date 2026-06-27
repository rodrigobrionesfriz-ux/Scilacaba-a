import {
  PROVEEDORES_SUBTITLE,
  PROVEEDORES_TITLE,
} from "@/constants/proveedores.constants"
import { getUsuarioActual } from "@/server/auth/auth.queries"
import { getProveedores } from "@/server/proveedores/proveedores.queries"
import { can } from "@/utils/permisos.utils"
import { ProveedoresTable } from "./proveedores.table"

export const ProveedoresView = async () => {
  const [usuario, proveedores] = await Promise.all([
    getUsuarioActual(),
    getProveedores(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">{PROVEEDORES_TITLE}</h1>
        <p className="text-muted-foreground">{PROVEEDORES_SUBTITLE}</p>
      </header>
      <ProveedoresTable
        proveedores={proveedores}
        puedeCrear={can(usuario, "proveedores.crear")}
      />
    </div>
  )
}
