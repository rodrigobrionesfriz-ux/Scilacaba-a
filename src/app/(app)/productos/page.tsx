import { requirePermiso } from "@/server/auth/auth.queries"
import { ProductosView } from "./(sections)/productos.view"

const ProductosPage = async () => {
  await requirePermiso("productos.ver")
  return <ProductosView />
}

export default ProductosPage
