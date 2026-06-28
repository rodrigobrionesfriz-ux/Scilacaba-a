"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  autorizarToma,
  devolverToma,
  rechazarToma,
} from "@/server/tomas/tomas.actions"
import type { TomaDetalle } from "@/types/tomas.types"
import { formatCLP } from "@/utils/money.utils"
import { calcularAjustes } from "@/utils/tomas.utils"
import { TomaMotivoDialog } from "./tomas.motivo-dialog"

export const TomaAutorizar = ({ toma }: { toma: TomaDetalle }) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const { sobrantes, faltantes } = calcularAjustes(toma.lineas)
  const conDif = toma.lineas.filter(
    (l) => l.fisicoIngresado && l.fisico !== null && l.fisico !== l.teorico,
  )

  const autorizar = () =>
    startTransition(async () => {
      const res = await autorizarToma(toma.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Ajustes aplicados")
      router.refresh()
    })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {conDif.length} línea(s) con diferencia · {sobrantes.length} sobrante(s)
          (TIE) · {faltantes.length} faltante(s) (TIS)
        </p>
        <div className="flex gap-2">
          <TomaMotivoDialog
            titulo={`Devolver toma ${toma.numero}`}
            descripcion="Indica qué debe corregir el operador. La toma volverá a ser editable."
            etiquetaBoton="Devolver"
            variant="outline"
            disabled={pending}
            onConfirm={(motivo) => devolverToma({ countId: toma.id, motivo })}
            onDone={() => router.push("/tomas")}
          />
          <TomaMotivoDialog
            titulo={`Rechazar toma ${toma.numero}`}
            descripcion="Rechazar archiva la toma sin aplicar ningún ajuste. No se puede deshacer."
            etiquetaBoton="Rechazar"
            variant="destructive"
            disabled={pending}
            onConfirm={(motivo) => rechazarToma({ countId: toma.id, motivo })}
            onDone={() => router.push("/tomas")}
          />
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button size="sm" disabled={pending}>
                  Autorizar y aplicar
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Autorizar toma {toma.numero}</AlertDialogTitle>
                <AlertDialogDescription>
                  Acción irreversible. Se generarán los ajustes por las
                  diferencias detectadas ({sobrantes.length} TIE, {faltantes.length}{" "}
                  TIS). Los costos usan el PPP congelado al iniciar la toma.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={autorizar} disabled={pending}>
                  Confirmar
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
              <TableHead className="text-right text-xs font-semibold">
                Impacto
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {toma.lineas.map((l) => {
              const fisico = l.fisicoIngresado ? l.fisico : null
              const dif = fisico !== null ? fisico - l.teorico : null
              return (
                <TableRow
                  key={l.id}
                  className={dif !== null && dif !== 0 ? "bg-amber-50" : ""}
                >
                  <TableCell>{l.codigoInterno}</TableCell>
                  <TableCell>{l.descripcion}</TableCell>
                  <TableCell>{l.lote ?? ""}</TableCell>
                  <TableCell className="text-right">{l.teorico}</TableCell>
                  <TableCell className="text-right">
                    {fisico ?? "—"}
                    {l.asumidoCero && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        (asumido)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{dif ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {dif === null ? "—" : formatCLP(dif * l.costoTeorico)}
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
