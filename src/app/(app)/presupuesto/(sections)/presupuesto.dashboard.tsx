"use client"

import { useMemo, useState } from "react"
import type {
  BudgetMeta,
  BudgetRow,
  FiltrosPresupuesto,
  Moneda,
} from "@/types/presupuesto.types"
import {
  calcularKpis,
  desviacionPorDescripcion,
  detalleDeDescripcion,
  filtrarFilas,
  montoPpto,
  opcionesFiltro,
  porDescripcion,
  porSubGrupo,
  porTipoCosto,
  serieMensual,
  topDesviaciones,
} from "@/utils/presupuesto.utils"
import { PresupuestoChartDescripcion } from "./presupuesto.chart-descripcion"
import { PresupuestoChartDesviacion } from "./presupuesto.chart-desviacion"
import { PresupuestoChartMensual } from "./presupuesto.chart-mensual"
import { PresupuestoChartSubgrupo } from "./presupuesto.chart-subgrupo"
import { PresupuestoChartTipo } from "./presupuesto.chart-tipo"
import { PresupuestoDetalleModal } from "./presupuesto.detalle-modal"
import { PresupuestoExportarPdf } from "./presupuesto.exportar-pdf"
import { PresupuestoFiltros } from "./presupuesto.filtros"
import { PresupuestoKpis } from "./presupuesto.kpis"
import { PresupuestoTopDesviaciones } from "./presupuesto.top-desviaciones"

const FILTROS_VACIOS: FiltrosPresupuesto = {
  temporada: "",
  mes: "",
  tipoCosto: "",
  subGrupo: "",
  descripcion: "",
}

export const PresupuestoDashboard = ({
  rows,
  meta,
}: {
  rows: BudgetRow[]
  meta: BudgetMeta | null
}) => {
  const [moneda, setMoneda] = useState<Moneda>("CLP")
  const [filtros, setFiltros] = useState<FiltrosPresupuesto>(FILTROS_VACIOS)
  const [seleccion, setSeleccion] = useState<string | null>(null)

  const opciones = useMemo(() => opcionesFiltro(rows), [rows])
  const filtradas = useMemo(() => filtrarFilas(rows, filtros), [rows, filtros])
  const kpis = useMemo(
    () => calcularKpis(filtradas, moneda),
    [filtradas, moneda],
  )
  const mensual = useMemo(
    () => serieMensual(filtradas, moneda),
    [filtradas, moneda],
  )
  const tipo = useMemo(
    () => porTipoCosto(filtradas, moneda),
    [filtradas, moneda],
  )
  const subgrupo = useMemo(
    () => porSubGrupo(filtradas, moneda),
    [filtradas, moneda],
  )
  const descripcion = useMemo(
    () => porDescripcion(filtradas, moneda),
    [filtradas, moneda],
  )
  const desviacion = useMemo(
    () => desviacionPorDescripcion(filtradas, moneda),
    [filtradas, moneda],
  )
  const top = useMemo(
    () => topDesviaciones(filtradas, moneda),
    [filtradas, moneda],
  )

  const detalleItems = seleccion
    ? detalleDeDescripcion(meta?.detalle ?? {}, seleccion, filtros.mes)
    : []
  const pptoSeleccion = seleccion
    ? filtradas
        .filter((r) => r.descripcion === seleccion)
        .reduce((s, r) => s + montoPpto(r, moneda), 0)
    : 0

  if (rows.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Sin datos de presupuesto. Importe un Excel para comenzar.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div className="flex justify-end">
        <PresupuestoExportarPdf moneda={moneda} filtros={filtros} />
      </div>

      <PresupuestoFiltros
        opciones={opciones}
        filtros={filtros}
        onFiltro={(parcial) => setFiltros((f) => ({ ...f, ...parcial }))}
        onReset={() => setFiltros(FILTROS_VACIOS)}
        moneda={moneda}
        onMoneda={setMoneda}
      />

      <PresupuestoKpis kpis={kpis} moneda={moneda} />

      <div className="grid gap-4 lg:grid-cols-2">
        <PresupuestoChartMensual datos={mensual} moneda={moneda} />
        <PresupuestoChartTipo datos={tipo} moneda={moneda} />
        <PresupuestoChartSubgrupo datos={subgrupo} moneda={moneda} />
        <PresupuestoTopDesviaciones
          filas={top}
          moneda={moneda}
          onSelect={setSeleccion}
        />
        <PresupuestoChartDescripcion datos={descripcion} moneda={moneda} />
        <PresupuestoChartDesviacion
          datos={desviacion}
          moneda={moneda}
          onSelect={setSeleccion}
        />
      </div>

      <PresupuestoDetalleModal
        descripcion={seleccion}
        items={detalleItems}
        ppto={pptoSeleccion}
        moneda={moneda}
        tc={meta?.kpis.tc ?? null}
        onOpenChange={(open) => {
          if (!open) setSeleccion(null)
        }}
      />
    </div>
  )
}
