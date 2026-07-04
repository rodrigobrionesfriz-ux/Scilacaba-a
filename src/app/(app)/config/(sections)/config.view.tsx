import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { CONFIG_SUBTITLE, CONFIG_TITLE } from "@/constants/config.constants"
import { getUsuarioActual } from "@/server/auth/auth.queries"
import {
  getEmpresa,
  getGruposConfig,
  getIndicadores,
  getTiposConfig,
} from "@/server/config/config.queries"
import { listarTemporadas } from "@/utils/indicadores.utils"
import { can } from "@/utils/permisos.utils"
import { BackupSection } from "./config.backup"
import { EmpresaForm } from "./config.empresa.form"
import { GruposSection } from "./config.grupos.section"
import { IndicadoresSection } from "./config.indicadores.section"
import { TemaSelector } from "./config.tema"
import { TiposSection } from "./config.tipos.section"

export const ConfigView = async () => {
  const [usuario, empresa, tipos, grupos, indicadores] = await Promise.all([
    getUsuarioActual(),
    getEmpresa(),
    getTiposConfig(),
    getGruposConfig(),
    getIndicadores(),
  ])
  const puedeEditar = can(usuario, "config.editar")
  const esAdmin = usuario?.role === "admin"
  const temporadas = listarTemporadas(indicadores)

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">{CONFIG_TITLE}</h1>
        <p className="text-muted-foreground">{CONFIG_SUBTITLE}</p>
      </header>
      <Tabs defaultValue="empresa">
        <TabsList>
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="catalogos">Tipos y grupos</TabsTrigger>
          <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
          <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
          {esAdmin && <TabsTrigger value="respaldo">Respaldo</TabsTrigger>}
        </TabsList>
        <TabsContent value="empresa" className="pt-4">
          <EmpresaForm empresa={empresa} puedeEditar={puedeEditar} />
        </TabsContent>
        <TabsContent value="catalogos" className="flex flex-col gap-8 pt-4">
          <TiposSection tipos={tipos} puedeEditar={puedeEditar} />
          <GruposSection grupos={grupos} puedeEditar={puedeEditar} />
        </TabsContent>
        <TabsContent value="indicadores" className="pt-4">
          <IndicadoresSection
            root={indicadores}
            temporadas={temporadas}
            puedeEditar={puedeEditar}
          />
        </TabsContent>
        <TabsContent value="apariencia" className="pt-4">
          <TemaSelector />
        </TabsContent>
        {esAdmin && (
          <TabsContent value="respaldo" className="pt-4">
            <BackupSection />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
