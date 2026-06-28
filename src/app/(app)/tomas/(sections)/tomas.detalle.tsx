import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ESTADO_APLICADA,
  ESTADO_DEVUELTA,
  ESTADO_PENDIENTE,
  ESTADO_RECHAZADA,
  ESTADOS_EDITABLES,
  TOMA_ESTADOS,
} from "@/constants/tomas.constants"
import type { UsuarioActual } from "@/types/auth.types"
import type { TomaDetalle } from "@/types/tomas.types"
import { can } from "@/utils/permisos.utils"
import { TomaAutorizar } from "./tomas.autorizar"
import { TomaCaptura } from "./tomas.captura"
import { TomaLineasReadOnly } from "./tomas.lineas-readonly"

type TomaDetalleViewProps = {
  toma: TomaDetalle
  usuario: UsuarioActual | null
}

export const TomaDetalleView = ({ toma, usuario }: TomaDetalleViewProps) => {
  const meta = TOMA_ESTADOS[toma.estado]
  const esDueno = usuario?.id === toma.usuario
  const editable =
    ESTADOS_EDITABLES.includes(toma.estado) &&
    esDueno &&
    can(usuario, "tomas.crear")
  const autorizable =
    toma.estado === ESTADO_PENDIENTE && can(usuario, "tomas.autorizar")

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            {toma.numero}
            <Badge variant={meta?.variant ?? "outline"}>
              {meta?.label ?? toma.estado}
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            {toma.bodega} · alcance {toma.alcance} ·{" "}
            {new Date(toma.creadoAt).toLocaleDateString("es-CL")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/tomas">Volver</Link>}
        />
      </header>

      {toma.estado === ESTADO_DEVUELTA && toma.devolucionMotivo && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          ↩️ Devuelta por el autorizador: {toma.devolucionMotivo}
        </p>
      )}
      {toma.estado === ESTADO_RECHAZADA && toma.rechazoMotivo && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          ✗ Rechazada: {toma.rechazoMotivo}
        </p>
      )}
      {toma.estado === ESTADO_APLICADA &&
        toma.movimientosGenerados.length > 0 && (
          <p className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
            ✓ Ajustes aplicados. Movimientos generados:
            {toma.movimientosGenerados.map((n) => (
              <Button
                key={n}
                variant="outline"
                size="sm"
                nativeButton={false}
                render={
                  <Link href={`/movimientos/${encodeURIComponent(n)}`}>{n}</Link>
                }
              />
            ))}
          </p>
        )}

      {toma.observaciones && (
        <p className="text-sm text-muted-foreground">{toma.observaciones}</p>
      )}

      {editable ? (
        <TomaCaptura toma={toma} />
      ) : autorizable ? (
        <TomaAutorizar toma={toma} />
      ) : (
        <TomaLineasReadOnly toma={toma} />
      )}
    </div>
  )
}
