// Tipos del módulo Presupuesto (regla 12). Solo importa constantes (hoja).

export type Moneda = "CLP" | "USD"

// Fila presupuestaria ya normalizada (montos como number: la query castea el
// numeric de Postgres). Espeja budget_rows + los alias del monolito.
export type BudgetRow = {
  id: number
  mes: string
  anio: number | null
  subGrupo: string
  tipoCosto: string
  descripcion: string
  temporada: string
  pptoClp: number
  realClp: number
  pptoUsd: number
  realUsd: number
  mesOrder: number | null
}

// Ítem de la hoja "Detalle Gastos" agrupado por descripción (index.html:18686).
export type DetalleGastoItem = {
  desc: string
  proveedor: string
  mes: string
  total: number
}

// Metadatos del dataset (singleton budget_meta).
export type BudgetMeta = {
  monthsWithReal: string[]
  kpis: { kg: number | null; tc: number | null; ha: number | null; kgEst: number | null }
  detalle: Record<string, DetalleGastoItem[]>
  updatedAt: string | null
}

// Filtros del dashboard ("" = sin filtro / todos).
export type FiltrosPresupuesto = {
  temporada: string
  mes: string
  tipoCosto: string
  subGrupo: string
  descripcion: string
}

// KPIs del encabezado (index.html:19250-19282).
export type KpisPresupuesto = {
  ppto: number
  real: number
  dev: number
  devPct: number
  mesesReal: number
  avance: number | null
  maxOverrun: { label: string; monto: number } | null
}

// Series para los gráficos.
export type PuntoMensual = { mes: string; ppto: number; real: number | null }
export type SerieCategoria = { label: string; ppto: number; real: number }
export type PuntoDonut = { label: string; valor: number }
export type PuntoDesviacion = {
  label: string
  dev: number
  ppto: number
  real: number
}
// Fila de la tabla Top Desviaciones (dev + % vs presupuesto).
export type FilaDesviacion = PuntoDesviacion & { devPct: number | null }

// Opciones dinámicas de los selects de filtro.
export type OpcionesFiltro = {
  temporadas: string[]
  meses: string[]
  tiposCosto: string[]
  subGrupos: string[]
  descripciones: string[]
}

// Criterio por temporada (index.html:20294). Vive en config.pz_criterios.items[].
export type Criterio = {
  id: string
  temporada: string
  tipo: string
  detalle: string
  fecha: string
  usuario: string
  modificado?: string
}

// Resultado del parseo puro del Excel (sin I/O). Los montos se dejan como number;
// la action los serializa a numeric string para el insert.
export type FilaExcelParseada = {
  mes: string
  anio: number | null
  subGrupo: string
  tipoCosto: string
  descripcion: string
  temporada: string
  pptoClp: number
  realClp: number
  pptoUsd: number
  realUsd: number
  mesOrder: number | null
}

export type ResultadoParseoExcel =
  | {
      ok: true
      filas: FilaExcelParseada[]
      monthsWithReal: string[]
      tc: number | null
    }
  | { ok: false; error: string }
