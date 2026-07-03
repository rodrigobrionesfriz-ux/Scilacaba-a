"use server"

import ExcelJS from "exceljs"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import {
  HOJA_BASE,
  HOJA_DETALLE,
  PZ_CRITERIOS_KEY,
} from "@/constants/presupuesto.constants"
import { db } from "@/db/client"
import { budgetMeta, budgetRows, config } from "@/db/schema"
import {
  criterioIdSchema,
  criterioSchema,
  type CriterioInput,
} from "@/schemas/presupuesto.schema"
import { requirePermiso } from "@/server/auth/auth.queries"
import type { ActionResult } from "@/types/action.types"
import type { Criterio, DetalleGastoItem } from "@/types/presupuesto.types"
import {
  construirFilasDesdeExcel,
  indiceMes,
  narrowCriterios,
  narrowKpisMeta,
} from "@/utils/presupuesto.utils"

const RUTA = "/presupuesto"

type ImportResult =
  | { ok: true; insertadas: number; mesesConReal: number }
  | { ok: false; error: string }

// Lee el valor primitivo de una celda de exceljs sin `as` (regla 11): resuelve
// fórmulas ({ result }), texto enriquecido ({ richText }) y hipervínculos.
const leerCelda = (v: unknown): string | number | null => {
  if (v == null) return null
  if (typeof v === "number") return v
  if (typeof v === "string") return v
  if (typeof v === "boolean") return v ? 1 : 0
  if (v instanceof Date) return v.toISOString()
  if (typeof v === "object") {
    const o: Record<string, unknown> = { ...v }
    if ("result" in o) return leerCelda(o.result)
    if ("text" in o) return leerCelda(o.text)
    if (Array.isArray(o.richText)) {
      return o.richText.map((t) => leerCelda(t)).join("")
    }
  }
  return null
}

const aTexto = (v: unknown): string =>
  v == null ? "" : typeof v === "string" ? v : String(v)

// Lee una hoja de exceljs a { headers, filas } (fila 1 = encabezados).
const leerHoja = (
  ws: ExcelJS.Worksheet,
): { headers: string[]; filas: Record<string, unknown>[] } => {
  const headers: string[] = []
  ws.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col - 1] = aTexto(leerCelda(cell.value)).trim()
  })
  const filas: Record<string, unknown>[] = []
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const obj: Record<string, unknown> = {}
    let vacia = true
    headers.forEach((h, idx) => {
      if (!h) return
      const val = leerCelda(row.getCell(idx + 1).value)
      if (val !== null && val !== "") vacia = false
      obj[h] = val
    })
    if (!vacia) filas.push(obj)
  })
  return { headers, filas }
}

// Reconstruye el blob "Detalle Gastos" agrupado por FAMILIA (index.html:18995).
const construirDetalle = (
  ws: ExcelJS.Worksheet,
): Record<string, DetalleGastoItem[]> => {
  const { filas } = leerHoja(ws)
  const salida: Record<string, DetalleGastoItem[]> = {}
  for (const r of filas) {
    const familia = aTexto(r.FAMILIA).trim()
    const total = Number.parseFloat(aTexto(r.TOTAL))
    if (!familia || !Number.isFinite(total) || total === 0) continue
    const item: DetalleGastoItem = {
      desc: (aTexto(r["DESCRIPCIÓN"]) || aTexto(r.DESCRIPCION) || "—").trim(),
      total: Math.round(total),
      proveedor: (aTexto(r.PROVEEDOR) || "—").trim(),
      mes: (aTexto(r.FECHA) || "—").trim().toUpperCase(),
    }
    ;(salida[familia] ??= []).push(item)
  }
  for (const k of Object.keys(salida)) {
    salida[k].sort((a, b) => indiceMes(a.mes) - indiceMes(b.mes))
  }
  return salida
}

// Importa un Excel (base64) y REEMPLAZA todo el dataset de presupuesto (paridad
// monolito index.html:18840-19023): parsea la hoja "Base", mergea PPTO/REAL y, si
// existe, reconstruye "Detalle Gastos". Permiso presupuesto.editar.
export const importarPresupuestoExcel = async (
  base64: string,
): Promise<ImportResult> => {
  await requirePermiso("presupuesto.editar")

  const libro = new ExcelJS.Workbook()
  try {
    const bin = Buffer.from(base64, "base64")
    // exceljs acepta ArrayBuffer; evita el desajuste Buffer<ArrayBuffer> de @types/node.
    await libro.xlsx.load(
      bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength),
    )
  } catch {
    return { ok: false, error: "No se pudo leer el archivo Excel." }
  }

  const hojaBase = libro.getWorksheet(HOJA_BASE)
  if (!hojaBase) {
    return { ok: false, error: `No se encontró la hoja "${HOJA_BASE}".` }
  }

  const { headers, filas } = leerHoja(hojaBase)
  const parseo = construirFilasDesdeExcel(headers, filas)
  if (!parseo.ok) return parseo
  // Salvaguarda: no reemplazar (vaciar) el dataset con un Excel sin filas útiles.
  if (parseo.filas.length === 0) {
    return {
      ok: false,
      error: "No se encontraron filas PRESUPUESTO/REAL en la hoja.",
    }
  }

  const hojaDetalle = libro.worksheets.find(
    (w) => w.name.trim().toLowerCase() === HOJA_DETALLE.toLowerCase(),
  )
  const detalle = hojaDetalle ? construirDetalle(hojaDetalle) : null

  await db.transaction(async (tx) => {
    const metaPrevia = await tx.query.budgetMeta.findFirst({
      where: eq(budgetMeta.id, "main"),
    })
    const kpisPrevios = narrowKpisMeta(metaPrevia?.kpis)

    await tx.delete(budgetRows)
    if (parseo.filas.length) {
      await tx.insert(budgetRows).values(
        parseo.filas.map((f) => ({
          mes: f.mes,
          anio: f.anio,
          subGrupo: f.subGrupo,
          tipoCosto: f.tipoCosto,
          descripcion: f.descripcion,
          temporada: f.temporada,
          pptoClp: String(f.pptoClp),
          realClp: String(f.realClp),
          pptoUsd: String(f.pptoUsd),
          realUsd: String(f.realUsd),
          mesOrder: f.mesOrder,
        })),
      )
    }

    const valores = {
      id: "main",
      monthsWithReal: parseo.monthsWithReal,
      kpis: { ...kpisPrevios, tc: parseo.tc ?? kpisPrevios.tc },
      detalle: detalle ?? metaPrevia?.detalle ?? {},
      updatedAt: new Date(),
    }
    await tx
      .insert(budgetMeta)
      .values(valores)
      .onConflictDoUpdate({
        target: budgetMeta.id,
        set: {
          monthsWithReal: valores.monthsWithReal,
          kpis: valores.kpis,
          detalle: valores.detalle,
          updatedAt: valores.updatedAt,
        },
      })
  })

  revalidatePath(RUTA)
  return {
    ok: true,
    insertadas: parseo.filas.length,
    mesesConReal: parseo.monthsWithReal.length,
  }
}

// Lee/escribe la lista de criterios en la fila config `pz_criterios` (blob jsonb),
// mismo shape del monolito { key, items[], _updatedAt }.
const escribirCriterios = async (items: Criterio[]): Promise<void> => {
  const valor = {
    key: PZ_CRITERIOS_KEY,
    items,
    _updatedAt: new Date().toISOString(),
  }
  await db
    .insert(config)
    .values({ clave: PZ_CRITERIOS_KEY, valor })
    .onConflictDoUpdate({ target: config.clave, set: { valor } })
}

const leerCriterios = async (): Promise<Criterio[]> => {
  const fila = await db.query.config.findFirst({
    where: eq(config.clave, PZ_CRITERIOS_KEY),
  })
  return narrowCriterios(fila?.valor)
}

// Crea o actualiza un criterio (index.html:20274). Permiso presupuesto.editar.
export const guardarCriterio = async (
  input: CriterioInput,
): Promise<ActionResult> => {
  const usuario = await requirePermiso("presupuesto.editar")
  const parsed = criterioSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }
  const { id, temporada, tipo, detalle } = parsed.data
  const items = await leerCriterios()
  const autor = usuario.nombre || usuario.id

  if (id) {
    const idx = items.findIndex((c) => c.id === id)
    if (idx < 0) return { ok: false, error: "El criterio ya no existe." }
    items[idx] = {
      ...items[idx],
      temporada,
      tipo,
      detalle,
      modificado: new Date().toISOString(),
      usuario: autor,
    }
  } else {
    items.push({
      id: `cr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      temporada,
      tipo,
      detalle,
      fecha: new Date().toISOString(),
      usuario: autor,
    })
  }

  await escribirCriterios(items)
  revalidatePath(RUTA)
  return { ok: true }
}

// Elimina un criterio por id. Permiso presupuesto.editar.
export const eliminarCriterio = async (id: string): Promise<ActionResult> => {
  await requirePermiso("presupuesto.editar")
  const parsed = criterioIdSchema.safeParse({ id })
  if (!parsed.success) return { ok: false, error: "Id inválido" }
  const items = await leerCriterios()
  await escribirCriterios(items.filter((c) => c.id !== parsed.data.id))
  revalidatePath(RUTA)
  return { ok: true }
}
