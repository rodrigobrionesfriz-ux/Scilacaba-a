import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { TomaDetalle } from "@/types/tomas.types"
import { formatCLP } from "@/utils/money.utils"

// Tabla de líneas en modo lectura (estados no editables y sin autorización).
export const TomaLineasReadOnly = ({ toma }: { toma: TomaDetalle }) => (
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
            Costo unit.
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {toma.lineas.map((l) => {
          const dif =
            l.fisicoIngresado && l.fisico !== null ? l.fisico - l.teorico : null
          return (
            <TableRow key={l.id}>
              <TableCell>{l.codigoInterno}</TableCell>
              <TableCell>{l.descripcion}</TableCell>
              <TableCell>{l.lote ?? ""}</TableCell>
              <TableCell className="text-right">{l.teorico}</TableCell>
              <TableCell className="text-right">
                {l.fisicoIngresado ? l.fisico : "—"}
                {l.asumidoCero && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    (asumido)
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {dif === null ? "—" : dif}
              </TableCell>
              <TableCell className="text-right">
                {formatCLP(l.costoTeorico)}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  </div>
)
