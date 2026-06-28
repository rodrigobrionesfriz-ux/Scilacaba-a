import { inventoryCountLines, inventoryCounts } from "@/db/schema"
import type { SciPayload } from "@/schemas/firestore-sci.schema"
import {
  boolDefaultFalse,
  parseDateOnly,
  parseTimestamp,
  toNumericString,
} from "@/utils/migracion.utils"

export type FilasTomas = {
  inventoryCounts: (typeof inventoryCounts.$inferInsert)[]
  inventoryCountLines: (typeof inventoryCountLines.$inferInsert)[]
  // Códigos referidos por las líneas (para resolver huérfanos en index.ts).
  referidos: Set<string>
}

// Tomas de inventario: inventoryCounts + sus `lineas[]` (¡no `detalles`!).
export const transformTomas = (p: SciPayload): FilasTomas => {
  const countsRows: FilasTomas["inventoryCounts"] = (
    p.inventoryCounts ?? []
  ).map((c) => ({
    id: c.id,
    numero: c.numero ?? "",
    bodegaId: c.bodegaId ?? "",
    estado: c.estado ?? "",
    alcance: c.alcance ?? "todos",
    filtroGrupo: c.filtroGrupo ?? null,
    filtroTipo: c.filtroTipo ?? null,
    observaciones: c.observaciones ?? null,
    usuario: c.usuario ?? "",
    autorizadoPor: c.autorizadoPor ?? null,
    devolucionMotivo: c.devolucionMotivo ?? null,
    rechazoMotivo: c.rechazoMotivo ?? null,
    movimientosGenerados: c.movimientosGenerados ?? null,
    creadoAt: parseTimestamp(c.creado) ?? undefined,
    cerradoAt: parseTimestamp(c.cerrado),
    cerradoPor: c.cerradoPor ?? null,
    autorizadoAt: parseTimestamp(c.autorizado),
    aplicadoAt: parseTimestamp(c.aplicado),
    devolucionAt: parseTimestamp(c.devolucionFecha),
    devolucionPor: c.devolucionPor ?? null,
    rechazoAt: parseTimestamp(c.rechazoFecha),
    rechazoPor: c.rechazoPor ?? null,
  }))

  const linesRows: FilasTomas["inventoryCountLines"] = []
  const referidos = new Set<string>()
  for (const c of p.inventoryCounts ?? []) {
    for (const l of c.lineas ?? []) {
      if (!l.codigoInterno) continue
      referidos.add(l.codigoInterno)
      linesRows.push({
        countId: c.id,
        codigoInterno: l.codigoInterno,
        descripcion: l.descripcion ?? null,
        unidadMedida: l.unidadMedida ?? null,
        manejaAtributos: boolDefaultFalse(l.manejaAtributos),
        loteId: l.loteId ?? null,
        lote: l.lote ?? null,
        fechaVenc: parseDateOnly(l.fechaVenc),
        teorico: toNumericString(l.teorico),
        costoTeorico: toNumericString(l.costoTeorico),
        fisico: l.fisico == null ? null : toNumericString(l.fisico),
        fisicoIngresado: boolDefaultFalse(l.fisicoIngresado),
        asumidoCero: boolDefaultFalse(l.asumidoCero),
      })
    }
  }

  return {
    inventoryCounts: countsRows,
    inventoryCountLines: linesRows,
    referidos,
  }
}
