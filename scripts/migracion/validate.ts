import type { SciPayload } from "@/schemas/firestore-sci.schema"
import { sciPayloadSchema } from "@/schemas/firestore-sci.schema"
import type { ResultadoPpp } from "@/types/movimientos.types"
import { rutValido } from "@/utils/migracion.utils"
import type { DocCrudo } from "./firebase"
import type { FilasMigracion } from "./transform"

export type Discrepancia = { tipo: string; detalle: string }

const TOL = 0.0001

// Prueba dura (migrator.md #3): stock recalculado == stock crudo del origen (±0.0001)
// por (cod|bod). Las diferencias son inconsistencias preexistentes → se reportan.
export const validarPpp = (
  doc: DocCrudo,
  recalc: ResultadoPpp,
): Discrepancia[] => {
  const p = sciPayloadSchema.parse(doc.payload ?? {})
  const problemas: Discrepancia[] = []

  const calcMap = new Map(
    recalc.stock.map((s) => [`${s.codigoInterno}|${s.bodegaId}`, s]),
  )
  const vistos = new Set<string>()

  for (const s of p.stock ?? []) {
    const key = `${s.codigoInterno ?? ""}|${s.bodegaId ?? ""}`
    vistos.add(key)
    const calc = calcMap.get(key)
    const origCant = Number(s.cantidad) || 0
    const origCosto = Number(s.costoPromedio) || 0
    const recCant = calc?.cantidad ?? 0
    const recCosto = calc?.costoPromedio ?? 0
    if (Math.abs(recCant - origCant) > TOL) {
      problemas.push({
        tipo: "stock-cantidad",
        detalle: `${key}: origen ${origCant} vs recalc ${recCant}`,
      })
    }
    if (Math.abs(recCosto - origCosto) > TOL) {
      problemas.push({
        tipo: "stock-costo",
        detalle: `${key}: origen ${origCosto} vs recalc ${recCosto}`,
      })
    }
  }

  for (const [key, s] of calcMap) {
    if (!vistos.has(key) && Math.abs(s.cantidad) > TOL) {
      problemas.push({
        tipo: "stock-extra",
        detalle: `${key}: recalc ${s.cantidad}, ausente en origen`,
      })
    }
  }

  return problemas
}

export type ConteoEntidad = {
  entidad: string
  countOrigen: number
  countDestino: number
}

const PLACEHOLDER = "[MIGRADO-HUÉRFANO]"

// Validaciones de integridad (migrator.md #1,2,4,5,6). No abortan: reportan.
export const validarIntegridad = (
  p: SciPayload,
  filas: FilasMigracion,
  conteos: ConteoEntidad[],
): Discrepancia[] => {
  const problemas: Discrepancia[] = []

  // #1 Conteos por entidad: destino < origen = posible pérdida de datos.
  // (products/field_products pueden diferir por placeholders/dedup → no es pérdida.)
  // config y counters tienen divergencia esperada: counters/productCounter se
  // extraen de config a la tabla counters → se excluyen del chequeo.
  const exentas = new Set(["config", "counters"])
  for (const c of conteos) {
    if (!exentas.has(c.entidad) && c.countDestino < c.countOrigen) {
      problemas.push({
        tipo: "conteo-faltante",
        detalle: `${c.entidad}: origen ${c.countOrigen} > destino ${c.countDestino}`,
      })
    }
  }

  // #2 Conteo de líneas: suma de detalles/lineas del origen vs filas hijas.
  // (Las líneas sin codigoInterno se descartan → destino puede ser menor.)
  const sumDetalles = (p.movements ?? []).reduce(
    (n, m) => n + (m.detalles?.length ?? 0),
    0,
  )
  if (filas.movementLines.length !== sumDetalles) {
    problemas.push({
      tipo: "lineas-movimientos",
      detalle: `detalles origen ${sumDetalles} vs movement_lines ${filas.movementLines.length}`,
    })
  }
  const sumTomaLineas = (p.inventoryCounts ?? []).reduce(
    (n, c) => n + (c.lineas?.length ?? 0),
    0,
  )
  if (filas.inventoryCountLines.length !== sumTomaLineas) {
    problemas.push({
      tipo: "lineas-tomas",
      detalle: `lineas origen ${sumTomaLineas} vs inventory_count_lines ${filas.inventoryCountLines.length}`,
    })
  }

  // #4 Huérfanos: productos placeholder creados por líneas sin catálogo.
  const huerfanos = filas.products
    .filter((pr) => pr.descripcion === PLACEHOLDER)
    .map((pr) => pr.codigoInterno)
  if (huerfanos.length) {
    problemas.push({
      tipo: "huerfanos",
      detalle: `${huerfanos.length} producto(s) placeholder: ${huerfanos.join(", ")}`,
    })
  }

  // #5 Correlativos: max(sufijo por prefijo) <= counters.valor.
  const valores = new Map(filas.counters.map((c) => [c.clave, c.valor ?? 0]))
  const numeros = [
    ...filas.movements.map((m) => m.numero),
    ...filas.inventoryCounts.map((c) => c.numero),
  ]
  const maxPorPrefijo = new Map<string, number>()
  for (const numero of numeros) {
    const m = numero?.match(/^([A-Za-z]+)-(\d+)$/)
    if (!m) continue
    const pref = m[1].toUpperCase()
    maxPorPrefijo.set(pref, Math.max(maxPorPrefijo.get(pref) ?? 0, Number(m[2])))
  }
  for (const [pref, max] of maxPorPrefijo) {
    if (valores.has(pref) && max > (valores.get(pref) ?? 0)) {
      problemas.push({
        tipo: "correlativo",
        detalle: `${pref}: max usado ${max} > counter ${valores.get(pref)}`,
      })
    }
  }

  // #6 RUT: dígito verificador inválido (no aborta).
  for (const ent of [...filas.providers, ...filas.customers]) {
    if (ent.rut && !rutValido(ent.rut)) {
      problemas.push({
        tipo: "rut-invalido",
        detalle: `${ent.codigo}: ${ent.rut}`,
      })
    }
  }

  return problemas
}
