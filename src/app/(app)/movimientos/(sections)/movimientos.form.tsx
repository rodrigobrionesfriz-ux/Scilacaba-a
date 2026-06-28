"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TIPOS_MOV_ENT,
  TIPOS_MOV_SAL,
  TIPOS_REQUIEREN_CENTRO_COSTO,
  TIPOS_REQUIEREN_CLIENTE,
  TIPOS_REQUIEREN_PROVEEDOR,
  TRASPASO_BODEGA,
} from "@/constants/movimientos.constants"
import type { Bodega } from "@/schemas/bodegas.schema"
import type { CentroCosto } from "@/schemas/centros-costo.schema"
import type { Cliente } from "@/schemas/clientes.schema"
import { movimientoSchema } from "@/schemas/movimientos.schema"
import type { Proveedor } from "@/schemas/proveedores.schema"
import { crearMovimiento } from "@/server/movimientos/movimientos.actions"
import type { Direccion, MovimientoLineaForm } from "@/types/movimientos.types"
import type { ProductoRow } from "@/types/productos.types"
import { MovimientoLineaFila } from "./movimientos.linea"

type MovimientoFormProps = {
  direccion: Direccion
  productos: ProductoRow[]
  bodegas: Bodega[]
  proveedores: Proveedor[]
  clientes: Cliente[]
  centrosCosto: CentroCosto[]
}

const lineaVacia = (): MovimientoLineaForm => ({
  codigoInterno: "",
  descripcion: "",
  unidadMedida: "",
  cantidad: "",
  costo: "",
  lote: "",
  fechaVenc: "",
})

const estadoInicial = {
  tipoMovimiento: "",
  fecha: "",
  bodegaId: "",
  bodegaDestinoId: "",
  proveedorCodigo: "",
  clienteCodigo: "",
  centroCosto: "",
  documento: "",
  numeroDoc: "",
  observaciones: "",
  autorizadoPor: "",
}

export const MovimientoForm = ({
  direccion,
  productos,
  bodegas,
  proveedores,
  clientes,
  centrosCosto,
}: MovimientoFormProps) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(estadoInicial)
  const [lineas, setLineas] = useState<MovimientoLineaForm[]>([lineaVacia()])

  const tipos = direccion === "ENT" ? TIPOS_MOV_ENT : TIPOS_MOV_SAL
  const tipoItems = tipos.map((t) => ({ value: t, label: t }))
  const bodegaItems = bodegas.map((b) => ({ value: b.id, label: b.nombre }))
  const proveedorItems = proveedores.map((p) => ({
    value: p.codigo,
    label: p.razonSocial,
  }))
  const clienteItems = clientes.map((c) => ({
    value: c.codigo,
    label: c.razonSocial,
  }))
  const centroCostoItems = centrosCosto.map((c) => ({
    value: c.codigo,
    label: c.descripcion,
  }))

  const set = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }))

  const setLinea = (index: number, patch: Partial<MovimientoLineaForm>) =>
    setLineas((prev) =>
      prev.map((l, idx) => (idx === index ? { ...l, ...patch } : l)),
    )
  const addLinea = () => setLineas((prev) => [...prev, lineaVacia()])
  const removeLinea = (index: number) =>
    setLineas((prev) =>
      prev.length > 1 ? prev.filter((_, idx) => idx !== index) : prev,
    )

  const tipo = form.tipoMovimiento
  const requiereProveedor = TIPOS_REQUIEREN_PROVEEDOR.includes(tipo)
  const requiereCliente = TIPOS_REQUIEREN_CLIENTE.includes(tipo)
  const requiereCentroCosto = TIPOS_REQUIEREN_CENTRO_COSTO.includes(tipo)
  const esTraspaso = tipo === TRASPASO_BODEGA

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsed = movimientoSchema.safeParse({ ...form, lineas })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos")
      return
    }
    startTransition(async () => {
      const res = await crearMovimiento(parsed.data)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Movimiento creado")
      router.push("/movimientos")
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>Tipo de movimiento *</Label>
          <Select
            items={tipoItems}
            value={form.tipoMovimiento}
            onValueChange={(v) => set("tipoMovimiento", v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona…" />
            </SelectTrigger>
            <SelectContent>
              {tipos.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fecha">Fecha *</Label>
          <Input
            id="fecha"
            type="date"
            value={form.fecha}
            onChange={(e) => set("fecha", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>{esTraspaso ? "Bodega origen *" : "Bodega *"}</Label>
          <Select
            items={bodegaItems}
            value={form.bodegaId}
            onValueChange={(v) => set("bodegaId", v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona…" />
            </SelectTrigger>
            <SelectContent>
              {bodegas.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {esTraspaso && (
          <div className="flex flex-col gap-2">
            <Label>Bodega destino *</Label>
            <Select
              items={bodegaItems}
              value={form.bodegaDestinoId}
              onValueChange={(v) => set("bodegaDestinoId", v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona…" />
              </SelectTrigger>
              <SelectContent>
                {bodegas.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {requiereProveedor && (
          <div className="flex flex-col gap-2">
            <Label>Proveedor *</Label>
            <Select
              items={proveedorItems}
              value={form.proveedorCodigo}
              onValueChange={(v) => set("proveedorCodigo", v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona…" />
              </SelectTrigger>
              <SelectContent>
                {proveedores.map((p) => (
                  <SelectItem key={p.codigo} value={p.codigo}>
                    {p.razonSocial}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {requiereCliente && (
          <div className="flex flex-col gap-2">
            <Label>Cliente *</Label>
            <Select
              items={clienteItems}
              value={form.clienteCodigo}
              onValueChange={(v) => set("clienteCodigo", v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona…" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.codigo} value={c.codigo}>
                    {c.razonSocial}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {requiereCentroCosto && (
          <div className="flex flex-col gap-2">
            <Label>Centro de costo *</Label>
            <Select
              items={centroCostoItems}
              value={form.centroCosto}
              onValueChange={(v) => set("centroCosto", v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona…" />
              </SelectTrigger>
              <SelectContent>
                {centrosCosto.map((c) => (
                  <SelectItem key={c.codigo} value={c.codigo}>
                    {c.descripcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="documento">Documento</Label>
          <Input
            id="documento"
            value={form.documento}
            onChange={(e) => set("documento", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="numeroDoc">N° documento</Label>
          <Input
            id="numeroDoc"
            value={form.numeroDoc}
            onChange={(e) => set("numeroDoc", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="autorizadoPor">Autorizado por</Label>
          <Input
            id="autorizadoPor"
            value={form.autorizadoPor}
            onChange={(e) => set("autorizadoPor", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="observaciones">Observaciones</Label>
        <Input
          id="observaciones"
          value={form.observaciones}
          onChange={(e) => set("observaciones", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Líneas</h2>
          <Button type="button" variant="outline" size="sm" onClick={addLinea}>
            Agregar línea
          </Button>
        </div>
        {lineas.map((linea, index) => (
          <MovimientoLineaFila
            // las líneas no tienen id estable mientras se editan; el índice es la clave
            key={index}
            linea={linea}
            index={index}
            productos={productos}
            onChange={setLinea}
            onRemove={removeLinea}
          />
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={<Link href="/movimientos">Cancelar</Link>}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Crear movimiento"}
        </Button>
      </div>
    </form>
  )
}
