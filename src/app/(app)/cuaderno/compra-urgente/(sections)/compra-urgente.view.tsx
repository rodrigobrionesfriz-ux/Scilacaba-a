import { requirePermiso } from "@/server/auth/auth.queries"
import { getComprasUrgentes } from "@/server/compras-urgentes/compras-urgentes.queries"
import { fmtCantidad } from "@/utils/cantidad.utils"

export const CompraUrgenteView = async () => {
  await requirePermiso("cuaderno.ver")
  const items = await getComprasUrgentes()

  if (items.length === 0)
    return (
      <p className="p-6 text-sm text-muted-foreground">
        No hay productos con faltante para las órdenes vigentes.
      </p>
    )

  return (
    <div className="flex flex-col gap-4 p-4">
      {items.map((item) => (
        <div key={item.producto} className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{item.producto}</h3>
            <span className="text-sm font-medium text-destructive">
              Comprar ≈ {fmtCantidad(item.totalFalta)} {item.unidad}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.enBodega
              ? `Disponible: ${fmtCantidad(item.disponible)} ${item.unidad}`
              : "No está en bodega"}
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {item.ordenes.map((o) => (
              <li key={o.id} className="flex justify-between">
                <span>
                  {o.numero} · {o.fecha}
                </span>
                <span className="text-muted-foreground">
                  requiere {fmtCantidad(o.requerido)} · falta {fmtCantidad(o.falta)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
