import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type DashboardAccionesProps = {
  puedeMovimientos: boolean
  puedeProductos: boolean
}

export const DashboardAcciones = ({
  puedeMovimientos,
  puedeProductos,
}: DashboardAccionesProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Accesos rápidos</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-2">
      {puedeMovimientos && (
        <Button
          nativeButton={false}
          render={<Link href="/movimientos/entradas">Nueva entrada</Link>}
        />
      )}
      {puedeMovimientos && (
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/movimientos/salidas">Nueva salida</Link>}
        />
      )}
      {puedeProductos && (
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/productos">Nuevo producto</Link>}
        />
      )}
      <Button
        variant="outline"
        nativeButton={false}
        render={<Link href="/stock">Ver stock</Link>}
      />
    </CardContent>
  </Card>
)
