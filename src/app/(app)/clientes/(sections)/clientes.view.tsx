import { CLIENTES_SUBTITLE, CLIENTES_TITLE } from "@/constants/clientes.constants"
import { getUsuarioActual } from "@/server/auth/auth.queries"
import { getClientes } from "@/server/clientes/clientes.queries"
import { can } from "@/utils/permisos.utils"
import { ClientesTable } from "./clientes.table"

export const ClientesView = async () => {
  const [usuario, clientes] = await Promise.all([
    getUsuarioActual(),
    getClientes(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">{CLIENTES_TITLE}</h1>
        <p className="text-muted-foreground">{CLIENTES_SUBTITLE}</p>
      </header>
      <ClientesTable
        clientes={clientes}
        puedeCrear={can(usuario, "clientes.crear")}
      />
    </div>
  )
}
