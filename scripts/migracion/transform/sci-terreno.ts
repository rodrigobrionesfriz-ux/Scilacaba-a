import { conteos, estimaciones, invplantas } from "@/db/schema"
import type { SciPayload } from "@/schemas/firestore-sci.schema"
import {
  boolDefaultFalse,
  parseEpochMs,
  parseTimestamp,
  toBigIntId,
  toIntOrNull,
  toNumericString,
} from "@/utils/migracion.utils"

export type FilasTerreno = {
  conteos: (typeof conteos.$inferInsert)[]
  invplantas: (typeof invplantas.$inferInsert)[]
  estimaciones: (typeof estimaciones.$inferInsert)[]
}

// Módulos de terreno (captura offline). arboles/plantas/secuencia se preservan
// verbatim (jsonb); _mod (epoch ms) → updated_at.
export const transformTerreno = (p: SciPayload): FilasTerreno => {
  const conteosRows: FilasTerreno["conteos"] = (p.conteos ?? []).map((c) => ({
    id: c.id,
    panoId: toBigIntId(c.panoId),
    panoNombre: c.panoNombre ?? null,
    variedad: c.variedad ?? null,
    especie: c.especie ?? null,
    etapa: c.etapa ?? null,
    fijosCodigos: c.fijosCodigos ?? null,
    usuario: c.usuario ?? null,
    arboles: c.arboles ?? [],
    promedioCentros:
      c.promedioCentros == null ? null : toNumericString(c.promedioCentros),
    nArboles: toIntOrNull(c.nArboles),
    sincronizado: boolDefaultFalse(c.sincronizado),
    fechaInicio: parseTimestamp(c.fechaInicio) ?? new Date(0),
    fechaFin: parseTimestamp(c.fechaFin),
    fechaSync: parseTimestamp(c.fechaSync),
    updatedAt: parseEpochMs(c._mod),
  }))

  const invplantasRows: FilasTerreno["invplantas"] = (p.invplantas ?? []).map(
    (ip) => ({
      id: ip.id,
      cuartelId: toBigIntId(ip.cuartelId),
      cuartel: ip.cuartel ?? null,
      variedad: ip.variedad ?? null,
      portainjerto: ip.portainjerto ?? null,
      polinizante: ip.polinizante ?? null,
      hilera: ip.hilera ?? null,
      codigoBase: ip.codigoBase ?? null,
      usuario: ip.usuario ?? null,
      countPrincipal: toIntOrNull(ip.countPrincipal),
      countPoliniz: toIntOrNull(ip.countPoliniz),
      secuencia: ip.secuencia ?? null,
      gpsInicio: ip.gpsInicio ?? null,
      gpsFin: ip.gpsFin ?? null,
      plantas: ip.plantas ?? [],
      sincronizado: boolDefaultFalse(ip.sincronizado),
      fechaInicio: parseTimestamp(ip.fechaInicio) ?? new Date(0),
      fechaSync: parseTimestamp(ip.fechaSync),
      updatedAt: parseEpochMs(ip._mod),
    }),
  )

  const estimacionesRows: FilasTerreno["estimaciones"] = (
    p.estimaciones ?? []
  ).map((e) => ({
    id: e.id,
    nombre: e.nombre ?? "",
    usuario: e.usuario ?? null,
    lineas: e.lineas ?? [],
    totalKg: e.totalKg == null ? null : toNumericString(e.totalKg),
    fecha: parseTimestamp(e.fecha) ?? new Date(0),
    updatedAt: parseEpochMs(e._mod) ?? parseTimestamp(e.modificado),
  }))

  return {
    conteos: conteosRows,
    invplantas: invplantasRows,
    estimaciones: estimacionesRows,
  }
}
