"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CAPTURA_FILTRO_CON_DIF,
  CAPTURA_FILTRO_PENDIENTES,
  CAPTURA_FILTRO_TODAS,
} from "@/constants/tomas.constants"
import { cerrarToma, guardarConteo } from "@/server/tomas/tomas.actions"
import type { TomaDetalle } from "@/types/tomas.types"

// Construye el payload de conteos para las actions desde el estado local (un
// string por línea: "" = sin ingresar, si no el número físico contado).
const aLineasPayload = (
  toma: TomaDetalle,
  valores: Record<number, string>,
) =>
  toma.lineas.map((l) => {
    const v = valores[l.id] ?? ""
    const ingresado = v.trim() !== ""
    return {
      id: l.id,
      fisico: ingresado ? Number(v) : null,
      fisicoIngresado: ingresado,
    }
  })

export const TomaCaptura = ({ toma }: { toma: TomaDetalle }) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [filtro, setFiltro] = useState(CAPTURA_FILTRO_TODAS)
  const [valores, setValores] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      toma.lineas.map((l) => [
        l.id,
        l.fisicoIngresado && l.fisico !== null ? String(l.fisico) : "",
      ]),
    ),
  )

  const setValor = (id: number, value: string) =>
    setValores((prev) => ({ ...prev, [id]: value }))

  const lineasVisibles = useMemo(() => {
    if (filtro === CAPTURA_FILTRO_PENDIENTES)
      return toma.lineas.filter((l) => (valores[l.id] ?? "").trim() === "")
    if (filtro === CAPTURA_FILTRO_CON_DIF)
      return toma.lineas.filter((l) => {
        const v = valores[l.id] ?? ""
        return v.trim() !== "" && Number(v) !== l.teorico
      })
    return toma.lineas
  }, [filtro, toma.lineas, valores])

  const pendientes = toma.lineas.filter(
    (l) => (valores[l.id] ?? "").trim() === "",
  ).length

  const filtroItems = [
    { value: CAPTURA_FILTRO_TODAS, label: "Todas las líneas" },
    { value: CAPTURA_FILTRO_PENDIENTES, label: `Pendientes (${pendientes})` },
    { value: CAPTURA_FILTRO_CON_DIF, label: "Con diferencia" },
  ]

  // ¿Algún valor ingresado no es un número válido? (bloquea guardar/cerrar)
  const hayInvalidos = toma.lineas.some((l) => {
    const v = valores[l.id] ?? ""
    return v.trim() !== "" && Number.isNaN(Number(v))
  })

  const guardar = () => {
    if (hayInvalidos) {
      toast.error("Hay conteos con valores no numéricos")
      return
    }
    startTransition(async () => {
      const res = await guardarConteo({
        countId: toma.id,
        lineas: aLineasPayload(toma, valores),
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Conteo guardado")
      router.refresh()
    })
  }

  const cerrar = () => {
    if (hayInvalidos) {
      toast.error("Hay conteos con valores no numéricos")
      return
    }
    startTransition(async () => {
      const res = await cerrarToma({
        countId: toma.id,
        lineas: aLineasPayload(toma, valores),
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Toma cerrada para autorización")
      router.push("/tomas")
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select
          items={filtroItems}
          value={filtro}
          onValueChange={(v) => setFiltro(v ?? CAPTURA_FILTRO_TODAS)}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filtroItems.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={guardar} disabled={pending}>
            {pending ? "Guardando…" : "Guardar conteo"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button size="sm" disabled={pending}>
                  Cerrar para autorización
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cerrar toma {toma.numero}</AlertDialogTitle>
                <AlertDialogDescription>
                  {pendientes > 0
                    ? `Hay ${pendientes} línea(s) sin contar: se asumirán en físico 0 al cerrar. `
                    : ""}
                  Una vez cerrada no podrás editarla salvo que el autorizador la
                  devuelva. ¿Cerrar para autorización?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={cerrar} disabled={pending}>
                  Cerrar toma
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="text-xs font-semibold">Código</TableHead>
              <TableHead className="text-xs font-semibold">Descripción</TableHead>
              <TableHead className="text-xs font-semibold">Lote</TableHead>
              <TableHead className="text-right text-xs font-semibold">
                Teórico
              </TableHead>
              <TableHead className="text-right text-xs font-semibold">
                Físico
              </TableHead>
              <TableHead className="text-right text-xs font-semibold">
                Diferencia
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineasVisibles.map((l) => {
              const v = valores[l.id] ?? ""
              const dif = v.trim() !== "" ? Number(v) - l.teorico : null
              return (
                <TableRow key={l.id}>
                  <TableCell>{l.codigoInterno}</TableCell>
                  <TableCell>{l.descripcion}</TableCell>
                  <TableCell>{l.lote ?? ""}</TableCell>
                  <TableCell className="text-right">{l.teorico}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="any"
                      min={0}
                      value={v}
                      onChange={(e) => setValor(l.id, e.target.value)}
                      placeholder="—"
                      className="ml-auto w-28 text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {dif === null || Number.isNaN(dif) ? "—" : dif}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
