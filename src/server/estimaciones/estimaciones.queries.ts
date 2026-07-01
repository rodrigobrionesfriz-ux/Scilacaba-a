import { asc, desc } from "drizzle-orm"
import {
  FRUTOS_CENTRO_DEFAULT,
  KG_FRUTO_DEFAULT,
} from "@/constants/terreno.constants"
import { db } from "@/db/client"
import { conteos, estimaciones, invplantas, panos } from "@/db/schema"
import type { EstimacionRow, PanoEstimBase } from "@/types/estimaciones.types"
import {
  narrowLineas,
  plantasProductivas,
  promedioCentrosPano,
  resolverPesos,
} from "@/utils/estimaciones.utils"
import { desgloseEstados, narrowPlantas } from "@/utils/invplantas.utils"

// Listado de versiones de estimación guardadas (lectura online), más
// recientes primero. numeric (string en pg) → number; fechas → ISO.
export const getEstimaciones = async (): Promise<EstimacionRow[]> => {
  const rows = await db
    .select()
    .from(estimaciones)
    .orderBy(desc(estimaciones.fecha))
  return rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    usuario: r.usuario ?? "",
    lineas: narrowLineas(r.lineas),
    totalKg: r.totalKg === null ? null : Number(r.totalKg),
    fecha: r.fecha.toISOString(),
    updatedAt: r.updatedAt === null ? null : r.updatedAt.toISOString(),
  }))
}

// Construye una línea base por paño para precargar el calculador: centros
// promedio desde conteos y plantas productivas equivalentes desde invplantas
// (match por id de paño). Espejo de ctePromedioCentrosPano/ctePlantasProductivas.
export const getDatosEstimacion = async (): Promise<PanoEstimBase[]> => {
  const [panosRows, conteosRows, invplantasRows] = await Promise.all([
    db.select().from(panos).orderBy(asc(panos.nombre)),
    db
      .select({ panoId: conteos.panoId, promedioCentros: conteos.promedioCentros })
      .from(conteos),
    db
      .select({ cuartelId: invplantas.cuartelId, plantas: invplantas.plantas })
      .from(invplantas),
  ])

  const conteosNum = conteosRows.map((c) => ({
    panoId: c.panoId,
    promedioCentros:
      c.promedioCentros === null ? null : Number(c.promedioCentros),
  }))

  return panosRows.map((p) => {
    const densidad = p.densidad === null ? 0 : Number(p.densidad)
    const hectareas = p.hectareas === null ? 0 : Number(p.hectareas)
    const plantasBase = p.plantas ?? Math.round(densidad * hectareas)

    const plantasHilera = invplantasRows
      .filter((h) => h.cuartelId === p.id)
      .flatMap((h) => narrowPlantas(h.plantas))
    const pesosEstado = resolverPesos(p.prodPct)
    const tieneInvplantas = plantasHilera.length > 0
    const desglose = tieneInvplantas ? desgloseEstados(plantasHilera) : null
    const { equiv, total } = desglose
      ? plantasProductivas(desglose, pesosEstado)
      : { equiv: 0, total: 0 }

    return {
      panoId: p.id,
      panoNombre: p.nombre,
      variedad: p.variedad ?? "",
      centros: promedioCentrosPano(conteosNum, p.id) ?? 0,
      frutosCentro: FRUTOS_CENTRO_DEFAULT,
      kgFruto: KG_FRUTO_DEFAULT,
      plantas: plantasBase,
      desglose,
      plantasEquiv: tieneInvplantas ? equiv : null,
      plantasInvTotal: tieneInvplantas ? total : null,
      usarEquiv: tieneInvplantas,
      pesosEstado,
    }
  })
}
