import {
  applicationConfirmations,
  applicationOrders,
  fertirriegoConfig,
  fertirriegoOrdenes,
  fertirriegoSectores,
  fieldProducts,
  fieldRecords,
  panos,
} from "@/db/schema"
import type { CuadernoPayload } from "@/schemas/firestore-cuaderno.schema"
import {
  boolDefaultFalse,
  parseDateOnly,
  parseTimestamp,
  toBigIntId,
  toIntOrNull,
  toNumericString,
  toStringArray,
} from "@/utils/migracion.utils"

export type FilasCuaderno = {
  panos: (typeof panos.$inferInsert)[]
  fieldRecords: (typeof fieldRecords.$inferInsert)[]
  fieldProducts: (typeof fieldProducts.$inferInsert)[]
  applicationOrders: (typeof applicationOrders.$inferInsert)[]
  applicationConfirmations: (typeof applicationConfirmations.$inferInsert)[]
  fertirriegoSectores: (typeof fertirriegoSectores.$inferInsert)[]
  fertirriegoOrdenes: (typeof fertirriegoOrdenes.$inferInsert)[]
  fertirriegoConfig: (typeof fertirriegoConfig.$inferInsert)[]
}

const numOrNull = (x: unknown): string | null =>
  x == null ? null : toNumericString(x)
const strOrNull = (x: unknown): string | null => (x == null ? null : String(x))

// Doc cuaderno/main (objeto S) → filas de DB del dominio cuaderno + fertirriego.
export const transformCuaderno = (c: CuadernoPayload): FilasCuaderno => {
  const panosRows: FilasCuaderno["panos"] = (c.panos ?? []).flatMap((pa) => {
    const id = toBigIntId(pa.id)
    if (id == null) return []
    return [
      {
        id,
        nombre: pa.nombre ?? "",
        variedad: pa.variedad ?? null,
        anio: pa.anio ?? null,
        hectareas: numOrNull(pa.hectareas),
        hasRiego: numOrNull(pa.has_riego),
        densidad: numOrNull(pa.densidad),
        color: pa.color ?? null,
        tipo: pa.tipo ?? null,
        panoPadre: pa.panoPadre ?? null,
        plantas: toIntOrNull(pa.plantas),
        deh: toIntOrNull(pa.deh),
        dsh: toIntOrNull(pa.dsh),
        portaInjerto: pa.portaInjerto ?? null,
        prodPct: pa.prodPct ?? null,
      },
    ]
  })
  const panoIds = new Set(panosRows.map((p) => p.id))

  const fieldRecordsRows: FilasCuaderno["fieldRecords"] = (
    c.registros ?? []
  ).flatMap((r) => {
    const id = toBigIntId(r.id)
    if (id == null) return []
    const panoId = toBigIntId(r.panoId)
    return [
      {
        id,
        fecha: parseDateOnly(r.fecha),
        panoId: panoId != null && panoIds.has(panoId) ? panoId : null,
        tipo: r.tipo ?? null,
        producto: r.producto ?? null,
        dosis: strOrNull(r.dosis),
        unidad: r.unidad ?? null,
        metodo: r.metodo ?? null,
        operador: r.operador ?? null,
        obs: r.obs ?? null,
        lote: r.lote ?? null,
      },
    ]
  })

  // PK = nombre → dedup defensivo (conserva el primero).
  const fieldProductsMap = new Map<string, FilasCuaderno["fieldProducts"][number]>()
  for (const fp of c.productos ?? []) {
    if (!fp.nombre || fieldProductsMap.has(fp.nombre)) continue
    fieldProductsMap.set(fp.nombre, {
      nombre: fp.nombre,
      tipo: fp.tipo ?? null,
      unidad: fp.unidad ?? null,
      dosis: strOrNull(fp.dosis),
      ingredienteActivo: fp.ingredienteActivo ?? null,
      objetivo: fp.objetivo ?? null,
      aportes: fp.aportes ?? null,
    })
  }

  const ordersRows: FilasCuaderno["applicationOrders"] = (
    c.ordenes ?? []
  ).flatMap((o) => {
    const id = toBigIntId(o.id)
    if (id == null) return []
    return [
      {
        id,
        numero: o.numero ?? "",
        fecha: parseDateOnly(o.fecha),
        tipoApp: o.tipoApp ?? null,
        fenologico: o.fenologico ?? null,
        objetivos: o.objetivos ?? [],
        objetivoOtro: o.objetivoOtro ?? null,
        especie: o.especie ?? null,
        responsable: o.responsable ?? null,
        metodo: o.metodo ?? null,
        panoIds: toStringArray(o.panoIds),
        productos: o.productos ?? [],
        distribucion: o.distribucion ?? [],
        producto: o.producto ?? null,
        dosis: numOrNull(o.dosis),
        unidad: o.unidad ?? null,
        unitS: o.unitS ?? null,
        moj: numOrNull(o.moj),
        vha: numOrNull(o.vha),
        mojT: numOrNull(o.mojT),
        notas: o.notas ?? null,
        tHas: numOrNull(o.tHas),
        tAgua: numOrNull(o.tAgua),
        tProd: numOrNull(o.tProd),
        margin: numOrNull(o.margin),
        editada: boolDefaultFalse(o.editada),
        editadaFecha: o.editadaFecha ?? null,
        editadaPor: o.editadaPor ?? null,
      },
    ]
  })
  const orderIds = new Set(ordersRows.map((o) => o.id))

  const confirmationsRows: FilasCuaderno["applicationConfirmations"] = (
    c.confirmaciones ?? []
  ).flatMap((cf) => {
    const id = toBigIntId(cf.id)
    if (id == null) return []
    const ordenId = toBigIntId(cf.ordenId)
    return [
      {
        id,
        ordenId: ordenId != null && orderIds.has(ordenId) ? ordenId : null,
        ordenNumero: cf.ordenNumero ?? null,
        fechaApp: parseDateOnly(cf.fechaApp),
        horaInicio: cf.horaInicio ?? null,
        horaFin: cf.horaFin ?? null,
        operador: cf.operador ?? null,
        equipo: cf.equipo ?? null,
        turno: cf.turno ?? null,
        tempAmb: numOrNull(cf.tempAmb),
        humedad: numOrNull(cf.humedad),
        viento: numOrNull(cf.viento),
        condClima: cf.condClima ?? null,
        panoIds: toStringArray(cf.panoIds),
        productosReales: cf.productosReales ?? [],
        aguaReal: numOrNull(cf.aguaReal),
        notas: cf.notas ?? null,
        creadaAt: parseTimestamp(cf.creada),
        creadaPor: cf.creadaPor ?? null,
      },
    ]
  })

  const fert = c.fertirriego ?? {}
  const sectoresRows: FilasCuaderno["fertirriegoSectores"] = (
    fert.sectores ?? []
  ).flatMap((sct) =>
    sct.id
      ? [
          {
            id: sct.id,
            nombre: sct.nombre ?? "",
            equipo: sct.equipo ?? null,
            ha: numOrNull(sct.ha),
            variedad: sct.variedad ?? null,
            plantas: toIntOrNull(sct.plantas),
          },
        ]
      : [],
  )

  const fertOrdenesRows: FilasCuaderno["fertirriegoOrdenes"] = (
    fert.ordenes ?? []
  ).flatMap((o) =>
    o.id
      ? [
          {
            id: o.id,
            numero: o.numero ?? "",
            fecha: parseDateOnly(o.fecha),
            forma: o.forma ?? null,
            horario: o.horario ?? null,
            estado: o.estado ?? null,
            responsable: o.responsable ?? null,
            sectores: o.sectores ?? null,
            lineas: o.lineas ?? [],
            confirmada: boolDefaultFalse(o.confirmada),
            confirmadaFecha: parseDateOnly(o.confirmadaFecha),
            creadoAt: parseTimestamp(o.creado),
            updatedAt: parseTimestamp(o.modificado),
          },
        ]
      : [],
  )

  const fertConfigRows: FilasCuaderno["fertirriegoConfig"] = fert.cfg
    ? [{ id: "main", cfg: fert.cfg }]
    : []

  return {
    panos: panosRows,
    fieldRecords: fieldRecordsRows,
    fieldProducts: [...fieldProductsMap.values()],
    applicationOrders: ordersRows,
    applicationConfirmations: confirmationsRows,
    fertirriegoSectores: sectoresRows,
    fertirriegoOrdenes: fertOrdenesRows,
    fertirriegoConfig: fertConfigRows,
  }
}
