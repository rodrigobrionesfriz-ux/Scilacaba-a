import { movementLines, movements } from "@/db/schema"
import type { SciPayload } from "@/schemas/firestore-sci.schema"
import {
  boolDefaultFalse,
  parseDateOnly,
  parseEpochMs,
  parseTimestamp,
  toNumericString,
} from "@/utils/migracion.utils"

export type FilasInventario = {
  movements: (typeof movements.$inferInsert)[]
  movementLines: (typeof movementLines.$inferInsert)[]
  // Códigos referidos por líneas (para resolver huérfanos en index.ts).
  referidos: Set<string>
}

// movements + movement_lines (libro mayor del PPP). detalles[] → movement_lines.
export const transformInventario = (p: SciPayload): FilasInventario => {
  const movementsRows: FilasInventario["movements"] = (p.movements ?? []).map(
    (m) => ({
      numero: m.numero,
      direccion: m.tipo === "ENT" ? "ENT" : "SAL",
      tipoMovimiento: m.tipoMovimiento ?? "",
      fecha: parseTimestamp(m.fecha) ?? parseTimestamp(m.creado) ?? new Date(0),
      bodegaId: m.bodegaId ?? "",
      bodegaDestinoId: m.bodegaDestinoId ?? null,
      documento: m.documento ?? null,
      tipoDoc: m.tipoDoc ?? null,
      numeroDoc: m.numeroDoc ?? null,
      proveedorCodigo: m.proveedorCodigo ?? null,
      clienteCodigo: m.clienteCodigo ?? null,
      centroCosto: m.centroCosto ?? null,
      observaciones: m.observaciones ?? null,
      usuario: m.usuario ?? "",
      autorizadoPor: m.autorizadoPor ?? null,
      tomaId: m.tomaId ?? null,
      tomaNumero: m.tomaNumero ?? null,
      anulado: boolDefaultFalse(m.anulado),
      creadoAt: parseTimestamp(m.creado) ?? undefined,
      updatedAt: parseEpochMs(m._mod),
    }),
  )

  const movementLinesRows: FilasInventario["movementLines"] = []
  const referidos = new Set<string>()
  for (const m of p.movements ?? []) {
    for (const d of m.detalles ?? []) {
      if (!d.codigoInterno) continue
      referidos.add(d.codigoInterno)
      movementLinesRows.push({
        movementNumero: m.numero,
        codigoInterno: d.codigoInterno,
        descripcion: d.descripcion ?? null,
        unidadMedida: d.unidadMedida ?? null,
        cantidad: toNumericString(d.cantidad),
        costo: toNumericString(d.costo),
        lote: d.lote ?? null,
        fechaVenc: parseDateOnly(d.fechaVenc),
        loteId: d.loteId ?? null,
      })
    }
  }

  return { movements: movementsRows, movementLines: movementLinesRows, referidos }
}
