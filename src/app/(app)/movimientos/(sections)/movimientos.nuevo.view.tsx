import {
  NUEVA_ENTRADA_SUBTITLE,
  NUEVA_ENTRADA_TITLE,
  NUEVA_SALIDA_SUBTITLE,
  NUEVA_SALIDA_TITLE,
} from "@/constants/movimientos.constants"
import { getBodegas } from "@/server/bodegas/bodegas.queries"
import { getCentrosCosto } from "@/server/centros-costo/centros-costo.queries"
import { getClientes } from "@/server/clientes/clientes.queries"
import { getProductos } from "@/server/productos/productos.queries"
import { getProveedores } from "@/server/proveedores/proveedores.queries"
import type { Direccion } from "@/types/movimientos.types"
import { MovimientoForm } from "./movimientos.form"

export const MovimientoNuevoView = async ({
  direccion,
}: {
  direccion: Direccion
}) => {
  const [productos, bodegas, proveedores, clientes, centrosCosto] =
    await Promise.all([
      getProductos(),
      getBodegas(),
      getProveedores(),
      getClientes(),
      getCentrosCosto(),
    ])

  const esEntrada = direccion === "ENT"

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">
          {esEntrada ? NUEVA_ENTRADA_TITLE : NUEVA_SALIDA_TITLE}
        </h1>
        <p className="text-muted-foreground">
          {esEntrada ? NUEVA_ENTRADA_SUBTITLE : NUEVA_SALIDA_SUBTITLE}
        </p>
      </header>
      <MovimientoForm
        direccion={direccion}
        productos={productos.filter((p) => p.activo && p.inventariable)}
        bodegas={bodegas.filter((b) => b.activo)}
        proveedores={proveedores.filter((p) => p.activo)}
        clientes={clientes.filter((c) => c.activo)}
        centrosCosto={centrosCosto.filter((c) => c.activo)}
      />
    </div>
  )
}
