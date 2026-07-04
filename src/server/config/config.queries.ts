import { asc, eq } from "drizzle-orm"
import { EMPRESA_KEY, INDICADORES_KEY } from "@/constants/config.constants"
import { db } from "@/db/client"
import { config, groups, productTypes } from "@/db/schema"
import type { Group } from "@/types/catalogos.types"
import type { Empresa, IndicadoresRoot, TipoRow } from "@/types/config.types"
import { narrowEmpresa, narrowIndicadoresRoot } from "@/utils/config.utils"

// Datos de la empresa (blob config.empresa; vacío si no configurado).
export const getEmpresa = async (): Promise<Empresa> => {
  const fila = await db.query.config.findFirst({
    where: eq(config.clave, EMPRESA_KEY),
  })
  return narrowEmpresa(fila?.valor)
}

// Indicadores diarios (todas las temporadas).
export const getIndicadores = async (): Promise<IndicadoresRoot> => {
  const fila = await db.query.config.findFirst({
    where: eq(config.clave, INDICADORES_KEY),
  })
  return narrowIndicadoresRoot(fila?.valor)
}

// Todos los tipos de producto (incluye inactivos) para el CRUD de configuración.
export const getTiposConfig = async (): Promise<TipoRow[]> => {
  const rows = await db
    .select()
    .from(productTypes)
    .orderBy(asc(productTypes.nombre))
  return rows.map((r) => ({
    nombre: r.nombre,
    descripcion: r.descripcion,
    activo: r.activo,
  }))
}

// Todos los grupos con sus subgrupos.
export const getGruposConfig = async (): Promise<Group[]> => {
  const rows = await db.select().from(groups).orderBy(asc(groups.nombre))
  return rows.map((r) => ({ nombre: r.nombre, subgrupos: r.subgrupos }))
}
