import { getUsuarioActual, requirePermiso } from "@/server/auth/auth.queries"
import { getInvplantas } from "@/server/invplantas/invplantas.queries"
import { getPanos } from "@/server/panos/panos.queries"
import type { CuartelOpcion } from "@/types/invplantas.types"
import { can } from "@/utils/permisos.utils"
import { InvplantasCapture } from "./invplantas.capture"
import { InvplantasLocalList } from "./invplantas.local-list"
import { InvplantasResumen } from "./invplantas.resumen"
import { InvplantasTable } from "./invplantas.table"

export const InvplantasView = async () => {
  await requirePermiso("invplantas.ver")
  const [usuario, filas, panos] = await Promise.all([
    getUsuarioActual(),
    getInvplantas(),
    getPanos(),
  ])
  const cuarteles: CuartelOpcion[] = panos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    variedad: p.variedad,
    plantas: p.plantas,
  }))
  const puedeRevisar = can(usuario, "invplantas.revisar")
  const puedeEditar = can(usuario, "invplantas.editar")
  const puedeActualizarPano = can(usuario, "cuaderno.panos")
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <InvplantasCapture
          cuarteles={cuarteles}
          usuario={usuario?.nombre ?? ""}
        />
        <InvplantasLocalList />
      </section>
      {puedeRevisar && (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Resumen por cuartel</h2>
            <InvplantasResumen
              filas={filas}
              cuarteles={cuarteles}
              puedeActualizarPano={puedeActualizarPano}
            />
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Hileras sincronizadas (nube)</h2>
            <InvplantasTable filas={filas} puedeEditar={puedeEditar} />
          </section>
        </>
      )}
    </div>
  )
}
