import Link from "next/link"

export const DashboardCompraUrgenteBanner = ({ count }: { count: number }) => {
  if (count === 0) return null

  return (
    <Link
      href="/cuaderno/compra-urgente"
      className="block rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 hover:bg-amber-100"
    >
      {count} {count === 1 ? "producto" : "productos"} con compra urgente
      pendiente. Ver detalle →
    </Link>
  )
}
