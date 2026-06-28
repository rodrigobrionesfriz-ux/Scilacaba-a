import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DIRECCION_LABEL } from "@/constants/movimientos.constants"
import type { MovimientoDetalle } from "@/types/movimientos.types"
import { formatCLP } from "@/utils/money.utils"

export const MovimientoDetalleView = ({
  movimiento: m,
}: {
  movimiento: MovimientoDetalle
}) => {
  const campos = [
    { label: "Fecha", value: new Date(m.fecha).toLocaleDateString("es-CL") },
    { label: "Bodega", value: m.bodega },
    { label: "Bodega destino", value: m.bodegaDestino },
    { label: "Proveedor", value: m.proveedor },
    { label: "Cliente", value: m.cliente },
    { label: "Centro de costo", value: m.centroCosto },
    { label: "Documento", value: m.documento },
    { label: "N° documento", value: m.numeroDoc },
    { label: "Usuario", value: m.usuario },
    { label: "Autorizado por", value: m.autorizadoPor },
    { label: "Observaciones", value: m.observaciones },
  ].filter((c) => c.value)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            {m.numero}
            {m.anulado && <Badge variant="secondary">Anulado</Badge>}
          </h1>
          <p className="text-muted-foreground">
            {m.tipoMovimiento} · {DIRECCION_LABEL[m.direccion]}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/movimientos">Volver</Link>}
        />
      </header>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        {campos.map((c) => (
          <div key={c.label} className="flex flex-col">
            <dt className="text-xs text-muted-foreground">{c.label}</dt>
            <dd className="text-sm">{c.value}</dd>
          </div>
        ))}
      </dl>

      <div className="rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="text-xs font-semibold">Código</TableHead>
              <TableHead className="text-xs font-semibold">Descripción</TableHead>
              <TableHead className="text-xs font-semibold">Lote</TableHead>
              <TableHead className="text-xs font-semibold">Cantidad</TableHead>
              <TableHead className="text-xs font-semibold">Costo</TableHead>
              <TableHead className="text-xs font-semibold">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {m.lineas.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{l.codigoInterno}</TableCell>
                <TableCell>{l.descripcion}</TableCell>
                <TableCell>{l.lote}</TableCell>
                <TableCell>
                  {l.cantidad} {l.unidadMedida}
                </TableCell>
                <TableCell>{formatCLP(l.costo)}</TableCell>
                <TableCell>{formatCLP(l.cantidad * l.costo)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
