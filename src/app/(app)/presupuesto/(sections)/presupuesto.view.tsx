import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  PRESUPUESTO_SUBTITLE,
  PRESUPUESTO_TITLE,
} from "@/constants/presupuesto.constants"
import { getUsuarioActual } from "@/server/auth/auth.queries"
import {
  getCriterios,
  getPresupuesto,
} from "@/server/presupuesto/presupuesto.queries"
import { can } from "@/utils/permisos.utils"
import { PresupuestoCriterios } from "./presupuesto.criterios"
import { PresupuestoDashboard } from "./presupuesto.dashboard"
import { PresupuestoImport } from "./presupuesto.import"

export const PresupuestoView = async () => {
  const [usuario, { rows, meta }, criterios] = await Promise.all([
    getUsuarioActual(),
    getPresupuesto(),
    getCriterios(),
  ])
  const puedeEditar = can(usuario, "presupuesto.editar")

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{PRESUPUESTO_TITLE}</h1>
          <p className="text-muted-foreground">{PRESUPUESTO_SUBTITLE}</p>
        </div>
        {puedeEditar && <PresupuestoImport />}
      </header>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="criterios">📋 Criterios</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <PresupuestoDashboard rows={rows} meta={meta} />
        </TabsContent>
        <TabsContent value="criterios">
          <PresupuestoCriterios
            criterios={criterios}
            temporadas={[...new Set(rows.map((r) => r.temporada))]
              .filter(Boolean)
              .sort()}
            puedeEditar={puedeEditar}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
