import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { MovimientoResumen } from "@/types/dashboard.types"
import { formatCLP } from "@/utils/money.utils"

export const DashboardMovimientosRecientes = ({
  movimientos,
}: {
  movimientos: MovimientoResumen[]
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Movimientos recientes</CardTitle>
    </CardHeader>
    <CardContent>
      {movimientos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin movimientos registrados.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Bodega</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movimientos.map((m) => (
              <TableRow key={m.numero} className="cursor-pointer">
                <TableCell>
                  <Link
                    href={`/movimientos/${encodeURIComponent(m.numero)}`}
                    className="block"
                  >
                    {m.numero}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={m.direccion === "ENT" ? "default" : "secondary"}>
                    {m.tipoMovimiento}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(m.fecha).toLocaleDateString("es-CL")}
                </TableCell>
                <TableCell>{m.bodega}</TableCell>
                <TableCell>{m.producto}</TableCell>
                <TableCell className="text-right">{m.items}</TableCell>
                <TableCell className="text-right">
                  {formatCLP(m.valor)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
)
