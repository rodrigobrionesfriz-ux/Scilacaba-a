import {
  COL_PPTO,
  COL_REAL,
  COLUMNAS_EXCEL_REQUERIDAS,
  DESC_CHART_LIMIT,
  HOJA_BASE,
  MESES_ORDEN,
  MONEDA_CLP,
  TIPO_FILA_PRESUPUESTO,
  TIPO_FILA_REAL,
  TOP_DESVIACIONES_LIMIT,
} from "@/constants/presupuesto.constants"
import type {
  BudgetMeta,
  BudgetRow,
  Criterio,
  DetalleGastoItem,
  FilaDesviacion,
  FiltrosPresupuesto,
  KpisPresupuesto,
  Moneda,
  OpcionesFiltro,
  PuntoDesviacion,
  PuntoDonut,
  PuntoMensual,
  ResultadoParseoExcel,
  SerieCategoria,
} from "@/types/presupuesto.types"

// Lógica pura del módulo Presupuesto (regla 8). Sin I/O. Fuente de verdad
// compartida por el dashboard (agregación reactiva por moneda/filtros) y por la
// action de importación (parseo/merge del Excel). Paridad con index.html:18567-19882.

// --- Coerciones sin `as` (regla 11) ---
const aTexto = (v: unknown): string =>
  v == null ? "" : typeof v === "string" ? v : String(v)

const aNumero = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0
  const n = Number.parseFloat(aTexto(v))
  return Number.isFinite(n) ? n : 0
}

// MESES_ORDEN es una tupla `as const`; para buscar strings arbitrarias la vemos
// como readonly string[] (indexOf acepta string).
const ordenMeses: readonly string[] = MESES_ORDEN

// Índice de un mes en la temporada (mayo=0 … abril=11); 99 si no reconocido
// (index.html:18879). Se usa para ordenar.
export const indiceMes = (mes: string): number => {
  const i = ordenMeses.indexOf(mes.toUpperCase().trim())
  return i >= 0 ? i : 99
}

// Deriva la temporada agrícola de un mes+año (index.html:9186). mayo..dic → año;
// ene..abr → año-1 (misma temporada empezó el año anterior).
export const temporadaDeMesAnio = (
  mes: string,
  anio: number | null,
): string => {
  if (anio == null || !Number.isFinite(anio)) return ""
  const idx = ordenMeses.indexOf(mes.toUpperCase().trim())
  if (idx < 0) return ""
  const inicio = idx >= 8 ? anio - 1 : anio
  return `${inicio}-${inicio + 1}`
}

// --- Selección de monto por moneda (index.html:18567) ---
export const montoPpto = (row: BudgetRow, moneda: Moneda): number =>
  moneda === MONEDA_CLP ? row.pptoClp : row.pptoUsd

export const montoReal = (row: BudgetRow, moneda: Moneda): number =>
  moneda === MONEDA_CLP ? row.realClp : row.realUsd

// --- Filtrado (index.html:19190) ---
export const filtrarFilas = (
  rows: readonly BudgetRow[],
  f: FiltrosPresupuesto,
): BudgetRow[] =>
  rows.filter(
    (d) =>
      (!f.temporada || d.temporada === f.temporada) &&
      (!f.mes || d.mes === f.mes) &&
      (!f.tipoCosto || d.tipoCosto.trim() === f.tipoCosto) &&
      (!f.subGrupo || d.subGrupo === f.subGrupo) &&
      (!f.descripcion || d.descripcion === f.descripcion),
  )

// Acumula ppto/real por una clave arbitraria (helper de las agregaciones).
const acumularPor = (
  rows: readonly BudgetRow[],
  moneda: Moneda,
  clave: (row: BudgetRow) => string,
): Map<string, { ppto: number; real: number }> => {
  const mapa = new Map<string, { ppto: number; real: number }>()
  for (const row of rows) {
    const k = clave(row)
    const acc = mapa.get(k) ?? { ppto: 0, real: 0 }
    acc.ppto += montoPpto(row, moneda)
    acc.real += montoReal(row, moneda)
    mapa.set(k, acc)
  }
  return mapa
}

// --- KPIs del encabezado (index.html:19250-19282) ---
export const calcularKpis = (
  rows: readonly BudgetRow[],
  moneda: Moneda,
): KpisPresupuesto => {
  let ppto = 0
  let real = 0
  const meses = new Set<string>()
  for (const row of rows) {
    ppto += montoPpto(row, moneda)
    const r = montoReal(row, moneda)
    real += r
    if (r > 0) meses.add(row.mes)
  }
  const dev = real - ppto
  const porDesc = acumularPor(rows, moneda, (d) => d.descripcion)
  let maxOverrun: KpisPresupuesto["maxOverrun"] = null
  for (const [label, v] of porDesc) {
    const d = v.real - v.ppto
    if (d > 0 && (!maxOverrun || d > maxOverrun.monto)) {
      maxOverrun = { label, monto: d }
    }
  }
  return {
    ppto,
    real,
    dev,
    devPct: ppto ? (dev / ppto) * 100 : 0,
    mesesReal: meses.size,
    avance: ppto ? Math.round((real / ppto) * 100) : null,
    maxOverrun,
  }
}

// --- Serie mensual, orden temporada (index.html:19293) ---
export const serieMensual = (
  rows: readonly BudgetRow[],
  moneda: Moneda,
): PuntoMensual[] => {
  const porMes = acumularPor(rows, moneda, (d) => d.mes.toUpperCase().trim())
  return MESES_ORDEN.map((mes) => {
    const v = porMes.get(mes) ?? { ppto: 0, real: 0 }
    return {
      mes: mes.slice(0, 3),
      ppto: Math.round(v.ppto),
      real: v.real > 0 ? Math.round(v.real) : null,
    }
  })
}

const limpiarTipo = (tipo: string): string =>
  tipo.replace("COSTOS ", "").replace("GASTOS ", "")

// --- Por tipo de costo (index.html:19356) ---
export const porTipoCosto = (
  rows: readonly BudgetRow[],
  moneda: Moneda,
): SerieCategoria[] => {
  const porTipo = acumularPor(rows, moneda, (d) => d.tipoCosto.trim())
  return [...porTipo.entries()]
    .filter(([, v]) => v.ppto > 0 || v.real > 0)
    .map(([label, v]) => ({
      label: limpiarTipo(label),
      ppto: Math.round(v.ppto),
      real: Math.round(v.real),
    }))
}

// --- Por sub-grupo, real acumulado, donut (index.html:19421) ---
export const porSubGrupo = (
  rows: readonly BudgetRow[],
  moneda: Moneda,
): PuntoDonut[] => {
  const mapa = new Map<string, number>()
  for (const row of rows) {
    const k = row.subGrupo
    mapa.set(k, (mapa.get(k) ?? 0) + montoReal(row, moneda))
  }
  return [...mapa.entries()]
    .filter(([, total]) => total > 0)
    .map(([label, total]) => ({ label, valor: Math.round(total) }))
}

// --- Por descripción, top N por mayor magnitud (index.html:19540) ---
export const porDescripcion = (
  rows: readonly BudgetRow[],
  moneda: Moneda,
): SerieCategoria[] => {
  const porDesc = acumularPor(rows, moneda, (d) => d.descripcion)
  return [...porDesc.entries()]
    .filter(([, v]) => v.ppto > 0 || v.real > 0)
    .sort(
      ([, a], [, b]) =>
        Math.max(b.ppto, b.real) - Math.max(a.ppto, a.real),
    )
    .slice(0, DESC_CHART_LIMIT)
    .map(([label, v]) => ({
      label,
      ppto: Math.round(v.ppto),
      real: Math.round(v.real),
    }))
}

// --- Desviación por descripción, asc (negativas izq.) (index.html:19653) ---
export const desviacionPorDescripcion = (
  rows: readonly BudgetRow[],
  moneda: Moneda,
): PuntoDesviacion[] => {
  const porDesc = acumularPor(rows, moneda, (d) => d.descripcion)
  return [...porDesc.entries()]
    .map(([label, v]) => ({
      label,
      dev: Math.round(v.real - v.ppto),
      ppto: Math.round(v.ppto),
      real: Math.round(v.real),
    }))
    .filter((x) => Math.abs(x.dev) > 0)
    .sort((a, b) => a.dev - b.dev)
}

// --- Top desviaciones (tabla), por mayor magnitud (index.html:19857) ---
export const topDesviaciones = (
  rows: readonly BudgetRow[],
  moneda: Moneda,
): FilaDesviacion[] => {
  const porDesc = acumularPor(rows, moneda, (d) => d.descripcion)
  return [...porDesc.entries()]
    .map(([label, v]) => ({
      label,
      dev: Math.round(v.real - v.ppto),
      ppto: Math.round(v.ppto),
      real: Math.round(v.real),
      devPct: v.ppto ? ((v.real - v.ppto) / v.ppto) * 100 : null,
    }))
    .filter((x) => Math.abs(x.dev) > 0)
    .sort((a, b) => Math.abs(b.dev) - Math.abs(a.dev))
    .slice(0, TOP_DESVIACIONES_LIMIT)
}

// --- Opciones de los selects de filtro ---
export const opcionesFiltro = (rows: readonly BudgetRow[]): OpcionesFiltro => {
  const uniq = (vals: string[]): string[] =>
    [...new Set(vals.filter((v) => v !== ""))].sort()
  const meses = [...new Set(rows.map((d) => d.mes))].sort(
    (a, b) => indiceMes(a) - indiceMes(b),
  )
  return {
    temporadas: uniq(rows.map((d) => d.temporada)),
    meses,
    tiposCosto: uniq(rows.map((d) => d.tipoCosto.trim())),
    subGrupos: uniq(rows.map((d) => d.subGrupo)),
    descripciones: uniq(rows.map((d) => d.descripcion)),
  }
}

// --- Detalle de gastos de una descripción (index.html:18588) ---
// Devuelve los ítems de la hoja Detalle Gastos para `descripcion`, filtrados por
// mes (si se pasa) y ordenados por orden de temporada.
export const detalleDeDescripcion = (
  detalle: Record<string, DetalleGastoItem[]>,
  descripcion: string,
  mes: string,
): DetalleGastoItem[] =>
  (detalle[descripcion] ?? [])
    .filter((x) => !mes || x.mes === mes)
    .slice()
    .sort((a, b) => indiceMes(a.mes) - indiceMes(b.mes))

// --- Importación de Excel: parseo/merge puro (index.html:18864-18934) ---
// Recibe la matriz ya leída de la hoja "Base" como objetos por encabezado. Separa
// PRESUPUESTO/REAL, mergea por clave MES|AÑO|SUB|TIPO|DESC y produce las filas
// (montos CLP/USD) + los meses con real + el TC del último mes con real.
export const construirFilasDesdeExcel = (
  headers: readonly string[],
  filas: readonly Record<string, unknown>[],
): ResultadoParseoExcel => {
  const faltantes = COLUMNAS_EXCEL_REQUERIDAS.filter(
    (c) => !headers.includes(c),
  )
  if (faltantes.length) {
    return { ok: false, error: `Columnas faltantes: ${faltantes.join(", ")}` }
  }
  if (!filas.length) {
    return { ok: false, error: `La hoja "${HOJA_BASE}" está vacía.` }
  }

  const claveDe = (r: Record<string, unknown>): string =>
    [
      aTexto(r.MES),
      aTexto(r["AÑO"]),
      aTexto(r["SUB-GRUPO"]),
      aTexto(r["TIPO DE COSTO"]),
      aTexto(r.DESCRIPCION),
    ].join("|")

  const pptoClp = new Map<string, number>()
  const pptoUsd = new Map<string, number>()
  const realClp = new Map<string, number>()
  const realUsd = new Map<string, number>()

  const filasPpto = filas.filter(
    (r) => aTexto(r.TIPO) === TIPO_FILA_PRESUPUESTO,
  )
  const filasReal = filas.filter((r) => aTexto(r.TIPO) === TIPO_FILA_REAL)

  for (const r of filasPpto) {
    const k = claveDe(r)
    const tc = Math.max(aNumero(r.TC) || 1, 1)
    const clp = aNumero(r[COL_PPTO])
    pptoClp.set(k, (pptoClp.get(k) ?? 0) + clp)
    const usd = aNumero(r["Ppto USD"]) > 0 ? aNumero(r["Ppto USD"]) : clp / tc
    pptoUsd.set(k, (pptoUsd.get(k) ?? 0) + usd)
  }
  for (const r of filasReal) {
    const k = claveDe(r)
    const tc = Math.max(aNumero(r.TC) || 1, 1)
    const clp = aNumero(r[COL_REAL])
    realClp.set(k, (realClp.get(k) ?? 0) + clp)
    const usd = aNumero(r["Real USD"]) > 0 ? aNumero(r["Real USD"]) : clp / tc
    realUsd.set(k, (realUsd.get(k) ?? 0) + usd)
  }

  const claves = new Set([...pptoClp.keys(), ...realClp.keys()])
  const filasParseadas = [...claves]
    .map((k) => {
      const [mes, anioTxt, subGrupo, tipoCosto, descripcion] = k.split("|")
      const anio = anioTxt ? Number.parseInt(anioTxt, 10) : null
      return {
        mes,
        anio: anio != null && Number.isFinite(anio) ? anio : null,
        subGrupo,
        tipoCosto,
        descripcion,
        temporada: temporadaDeMesAnio(mes, anio),
        pptoClp: pptoClp.get(k) ?? 0,
        realClp: realClp.get(k) ?? 0,
        pptoUsd: pptoUsd.get(k) ?? 0,
        realUsd: realUsd.get(k) ?? 0,
        mesOrder: indiceMes(mes),
      }
    })
    .sort((a, b) => (a.mesOrder ?? 99) - (b.mesOrder ?? 99))

  const monthsWithReal = [
    ...new Set(
      filasParseadas.filter((d) => d.realClp > 0).map((d) => d.mes),
    ),
  ]
  const ultimoMes = monthsWithReal[monthsWithReal.length - 1] ?? ""
  const filaTc = filasReal.find(
    (r) =>
      aTexto(r.MES).toUpperCase() === ultimoMes.toUpperCase() &&
      aNumero(r.TC) > 0,
  )
  const tc = filaTc ? aNumero(filaTc.TC) : null

  return { ok: true, filas: filasParseadas, monthsWithReal, tc }
}

// --- Narrowing de blobs jsonb (regla 11: sin `as`) ---

const esRegistro = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null

// Narrowea un ítem de detalle de gasto ({ desc, proveedor, mes, total }).
const narrowDetalleItem = (v: unknown): DetalleGastoItem => {
  const o = esRegistro(v) ? v : {}
  return {
    desc: aTexto(o.desc),
    proveedor: aTexto(o.proveedor),
    mes: aTexto(o.mes),
    total: aNumero(o.total),
  }
}

// Narrowea el blob budget_meta.detalle → Record<descripcion, DetalleGastoItem[]>.
export const narrowDetalle = (
  blob: unknown,
): Record<string, DetalleGastoItem[]> => {
  if (!esRegistro(blob)) return {}
  const salida: Record<string, DetalleGastoItem[]> = {}
  for (const [k, v] of Object.entries(blob)) {
    if (Array.isArray(v)) salida[k] = v.map(narrowDetalleItem)
  }
  return salida
}

// Narrowea los kpis de budget_meta (kg/tc/ha/kgEst numéricos o null).
export const narrowKpisMeta = (blob: unknown): BudgetMeta["kpis"] => {
  const o = esRegistro(blob) ? blob : {}
  const numOrNull = (v: unknown): number | null =>
    typeof v === "number" && Number.isFinite(v) ? v : null
  return {
    kg: numOrNull(o.kg),
    tc: numOrNull(o.tc),
    ha: numOrNull(o.ha),
    kgEst: numOrNull(o.kgEst),
  }
}

// Narrowea un criterio del blob config.pz_criterios.items[] (regla 11).
const narrowCriterio = (v: unknown): Criterio | null => {
  const o = esRegistro(v) ? v : {}
  const id = aTexto(o.id)
  if (!id) return null
  return {
    id,
    temporada: aTexto(o.temporada),
    tipo: aTexto(o.tipo),
    detalle: aTexto(o.detalle),
    fecha: aTexto(o.fecha),
    usuario: aTexto(o.usuario),
    ...(o.modificado != null ? { modificado: aTexto(o.modificado) } : {}),
  }
}

// Lee los criterios desde el valor jsonb de la fila config `pz_criterios`.
export const narrowCriterios = (valor: unknown): Criterio[] => {
  if (!esRegistro(valor)) return []
  const items = valor.items
  if (!Array.isArray(items)) return []
  return items.map(narrowCriterio).filter((c): c is Criterio => c !== null)
}
