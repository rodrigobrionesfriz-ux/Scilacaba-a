import { asc, desc, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { fertirriegoOrdenes, fertirriegoSectores, fieldProducts } from "@/db/schema"
import { TIPOS_FR } from "@/constants/fertirriego.constants"
import type { OafRow, ProductoFertRow } from "@/types/fertirriego.types"
import { aAportes, aLineas } from "@/utils/fertirriego.utils"

type FilaOaf = typeof fertirriegoOrdenes.$inferSelect
type SectorMin = { nombre: string; ha: number }

const mapearOaf = (r: FilaOaf, sectores: Map<string, SectorMin>): OafRow => {
  const ids = r.sectores ?? []
  const seleccionados = ids.flatMap((id) => {
    const s = sectores.get(id)
    return s ? [s] : []
  })
  return {
    id: r.id,
    numero: r.numero,
    fecha: r.fecha ?? "",
    forma: r.forma ?? "",
    horario: r.horario ?? "",
    estado: r.estado ?? "",
    responsable: r.responsable ?? "",
    sectores: ids,
    nombresSectores: seleccionados.map((s) => s.nombre),
    haTotal: seleccionados.reduce((acc, s) => acc + s.ha, 0),
    lineas: aLineas(r.lineas),
    confirmada: r.confirmada,
    confirmadaFecha: r.confirmadaFecha ?? "",
  }
}

// Mapa id → {nombre, ha} de todos los sectores (para derivar nombres y há total).
const getSectoresMin = async (): Promise<Map<string, SectorMin>> => {
  const rows = await db
    .select({
      id: fertirriegoSectores.id,
      nombre: fertirriegoSectores.nombre,
      ha: fertirriegoSectores.ha,
    })
    .from(fertirriegoSectores)
  return new Map(
    rows.map((r) => [r.id, { nombre: r.nombre, ha: r.ha === null ? 0 : Number(r.ha) }]),
  )
}

// Listado de OAF (más recientes primero) con nombres de sectores y há total.
export const getOrdenesFert = async (): Promise<OafRow[]> => {
  const [rows, sectores] = await Promise.all([
    db.select().from(fertirriegoOrdenes).orderBy(desc(fertirriegoOrdenes.creadoAt)),
    getSectoresMin(),
  ])
  return rows.map((r) => mapearOaf(r, sectores))
}

// Una OAF por id (para editar/ver detalle). null si no existe.
export const getOrdenFert = async (id: string): Promise<OafRow | null> => {
  const row = await db.query.fertirriegoOrdenes.findFirst({
    where: eq(fertirriegoOrdenes.id, id),
  })
  if (!row) return null
  return mapearOaf(row, await getSectoresMin())
}

// Productos del catálogo aplicables a fertirriego (fertilizantes de suelo/enmiendas),
// con su composición nutricional (aportes) para el cálculo y la edición.
export const getProductosFertirriego = async (): Promise<ProductoFertRow[]> => {
  const rows = await db
    .select()
    .from(fieldProducts)
    .orderBy(asc(fieldProducts.nombre))
  const tipos = new Set<string>(TIPOS_FR)
  return rows
    .filter((r) => tipos.has((r.tipo ?? "").toLowerCase().trim()))
    .map((r) => ({
      nombre: r.nombre,
      tipo: r.tipo ?? "",
      unidad: r.unidad ?? "",
      dosis: r.dosis ?? "",
      aportes: aAportes(r.aportes),
    }))
}
