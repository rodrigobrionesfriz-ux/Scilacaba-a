import { getUsuarioActual, requirePermiso } from "@/server/auth/auth.queries"
import { getConteos } from "@/server/conteos/conteos.queries"
import { getPanos } from "@/server/panos/panos.queries"
import type { PanoOpcion } from "@/types/conteos.types"
import { can } from "@/utils/permisos.utils"
import { ConteosCapture } from "./conteos.capture"
import { ConteosLocalList } from "./conteos.local-list"
import { ConteosTable } from "./conteos.table"

export const ConteosView = async () => {
  await requirePermiso("conteos.ver")
  const [usuario, conteosCloud, panos] = await Promise.all([
    getUsuarioActual(),
    getConteos(),
    getPanos(),
  ])
  const opciones: PanoOpcion[] = panos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    variedad: p.variedad,
  }))
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <ConteosCapture panos={opciones} usuario={usuario?.nombre ?? ""} />
        <ConteosLocalList />
      </section>
      {can(usuario, "conteos.revisar") && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Conteos sincronizados (nube)</h2>
          <ConteosTable conteos={conteosCloud} />
        </section>
      )}
    </div>
  )
}
