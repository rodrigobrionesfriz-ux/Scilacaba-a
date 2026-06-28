import { requirePermiso } from "@/server/auth/auth.queries"
import { StockView } from "./(sections)/stock.view"

const StockPage = async () => {
  await requirePermiso("stock.ver")
  return <StockView />
}

export default StockPage
