"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MONEDA_CLP, MONEDA_USD } from "@/constants/presupuesto.constants"
import type {
  FiltrosPresupuesto,
  Moneda,
  OpcionesFiltro,
} from "@/types/presupuesto.types"

type PresupuestoFiltrosProps = {
  opciones: OpcionesFiltro
  filtros: FiltrosPresupuesto
  onFiltro: (parcial: Partial<FiltrosPresupuesto>) => void
  onReset: () => void
  moneda: Moneda
  onMoneda: (m: Moneda) => void
}

const TODAS = "__todas__"

// Select de un filtro: value crudo "" = todas; items lleva la opción "Todas" para
// que el Value muestre el label (base-ui necesita items en el Root).
const FiltroSelect = ({
  etiqueta,
  valor,
  opciones,
  onValor,
  ancho = "w-44",
}: {
  etiqueta: string
  valor: string
  opciones: string[]
  onValor: (v: string) => void
  ancho?: string
}) => {
  const items = [
    { value: TODAS, label: etiqueta },
    ...opciones.map((o) => ({ value: o, label: o })),
  ]
  return (
    <Select
      items={items}
      value={valor === "" ? TODAS : valor}
      onValueChange={(v) => onValor(v === TODAS ? "" : (v ?? ""))}
    >
      <SelectTrigger className={ancho}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((i) => (
          <SelectItem key={i.value} value={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export const PresupuestoFiltros = ({
  opciones,
  filtros,
  onFiltro,
  onReset,
  moneda,
  onMoneda,
}: PresupuestoFiltrosProps) => (
  <div className="flex flex-wrap items-center gap-2">
    {opciones.temporadas.length > 1 && (
      <FiltroSelect
        etiqueta="Todas las temporadas"
        valor={filtros.temporada}
        opciones={opciones.temporadas}
        onValor={(temporada) => onFiltro({ temporada })}
        ancho="w-40"
      />
    )}
    <FiltroSelect
      etiqueta="Todos los meses"
      valor={filtros.mes}
      opciones={opciones.meses}
      onValor={(mes) => onFiltro({ mes })}
      ancho="w-40"
    />
    <FiltroSelect
      etiqueta="Todos los tipos"
      valor={filtros.tipoCosto}
      opciones={opciones.tiposCosto}
      onValor={(tipoCosto) => onFiltro({ tipoCosto })}
      ancho="w-48"
    />
    <FiltroSelect
      etiqueta="Todos los sub-grupos"
      valor={filtros.subGrupo}
      opciones={opciones.subGrupos}
      onValor={(subGrupo) => onFiltro({ subGrupo })}
      ancho="w-48"
    />
    <FiltroSelect
      etiqueta="Todas las descripciones"
      valor={filtros.descripcion}
      opciones={opciones.descripciones}
      onValor={(descripcion) => onFiltro({ descripcion })}
      ancho="w-56"
    />
    <Button type="button" size="sm" variant="ghost" onClick={onReset}>
      Limpiar
    </Button>
    <div className="ml-auto inline-flex overflow-hidden rounded-md border">
      {[MONEDA_CLP, MONEDA_USD].map((m) => (
        <Button
          key={m}
          type="button"
          size="sm"
          variant={moneda === m ? "default" : "ghost"}
          className="rounded-none"
          onClick={() => onMoneda(m === MONEDA_CLP ? "CLP" : "USD")}
        >
          {m}
        </Button>
      ))}
    </div>
  </div>
)
