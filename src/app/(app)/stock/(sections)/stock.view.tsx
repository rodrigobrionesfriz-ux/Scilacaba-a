import { STOCK_SUBTITLE, STOCK_TITLE } from "@/constants/movimientos.constants"
import { getBodegas } from "@/server/bodegas/bodegas.queries"
import { getStock } from "@/server/stock/stock.queries"
import { StockTable } from "./stock.table"

export const StockView = async () => {
  const [stock, bodegas] = await Promise.all([getStock(), getBodegas()])

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">{STOCK_TITLE}</h1>
        <p className="text-muted-foreground">{STOCK_SUBTITLE}</p>
      </header>
      <StockTable stock={stock} bodegas={bodegas} />
    </div>
  )
}
