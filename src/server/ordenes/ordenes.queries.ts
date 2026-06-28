import { desc, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { applicationConfirmations, applicationOrders } from "@/db/schema"
import type { OrdenRow } from "@/types/ordenes.types"
import {
  aDistribucion,
  aProductosOrden,
  estadoOrden,
} from "@/utils/ordenes.utils"

type FilaOrden = typeof applicationOrders.$inferSelect

// Cobertura de confirmaciones por orden: cuántas hay y qué paños cubren (para
// derivar el estado Pendiente/Parcial/Completa).
type Cobertura = { n: number; panos: string[] }

const mapearOrden = (r: FilaOrden, cobertura: Cobertura | undefined): OrdenRow => {
  const panoIds = r.panoIds ?? []
  const cob = cobertura ?? { n: 0, panos: [] }
  return {
    id: r.id,
    numero: r.numero,
    fecha: r.fecha ?? "",
    tipoApp: r.tipoApp ?? "",
    fenologico: r.fenologico ?? "",
    especie: r.especie ?? "",
    responsable: r.responsable ?? "",
    metodo: r.metodo ?? "",
    objetivos: r.objetivos ?? [],
    objetivoOtro: r.objetivoOtro ?? "",
    panoIds,
    productos: aProductosOrden(r.productos),
    distribucion: aDistribucion(r.distribucion),
    moj: r.moj === null ? 0 : Number(r.moj),
    vha: r.vha === null ? 1 : Number(r.vha),
    mojT: r.mojT === null ? 0 : Number(r.mojT),
    tHas: r.tHas === null ? 0 : Number(r.tHas),
    tAgua: r.tAgua === null ? 0 : Number(r.tAgua),
    tProd: r.tProd === null ? 0 : Number(r.tProd),
    notas: r.notas ?? "",
    editada: r.editada,
    estado: estadoOrden(panoIds, cob.panos, cob.n),
    nConfirmaciones: cob.n,
  }
}

// Cobertura de confirmaciones agrupada por ordenId.
const getCobertura = async (): Promise<Map<number, Cobertura>> => {
  const confs = await db
    .select({
      ordenId: applicationConfirmations.ordenId,
      panoIds: applicationConfirmations.panoIds,
    })
    .from(applicationConfirmations)
  const mapa = new Map<number, Cobertura>()
  for (const c of confs) {
    if (c.ordenId === null) continue
    const cob = mapa.get(c.ordenId) ?? { n: 0, panos: [] }
    cob.n += 1
    cob.panos.push(...(c.panoIds ?? []))
    mapa.set(c.ordenId, cob)
  }
  return mapa
}

// Listado de órdenes (más recientes primero) con estado de cobertura derivado.
export const getOrdenes = async (): Promise<OrdenRow[]> => {
  const [rows, cobertura] = await Promise.all([
    db.select().from(applicationOrders).orderBy(desc(applicationOrders.creadoAt)),
    getCobertura(),
  ])
  return rows.map((r) => mapearOrden(r, cobertura.get(r.id)))
}

// Una orden por id (para editar/ver detalle). null si no existe.
export const getOrden = async (id: number): Promise<OrdenRow | null> => {
  const row = await db.query.applicationOrders.findFirst({
    where: eq(applicationOrders.id, id),
  })
  if (!row) return null
  const cobertura = await getCobertura()
  return mapearOrden(row, cobertura.get(id))
}
