import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { StockBajoRow } from "@/types/dashboard.types"
import { fmtCantidad } from "@/utils/cantidad.utils"

export const DashboardStockBajo = ({ filas }: { filas: StockBajoRow[] }) => {
  if (filas.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock bajo</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Bodega</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Mínimo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((f, i) => (
              <TableRow key={`${f.codigoInterno}-${f.bodega}-${i}`}>
                <TableCell>{f.descripcion}</TableCell>
                <TableCell>{f.bodega}</TableCell>
                <TableCell className="text-right">
                  {fmtCantidad(f.cantidad)}
                </TableCell>
                <TableCell className="text-right">
                  {fmtCantidad(f.minimo)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
