// Formatea un monto como pesos chilenos: 1000 -> "$1.000".
export const formatCLP = (amount: number): string =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount)

// Formatea un monto en dólares: 1000 -> "USD 1.000" (entero, separador de miles
// es-CL). Paridad con fmtVal del monolito (index.html:18570) para el toggle CLP/USD.
export const formatUSD = (amount: number): string =>
  `USD ${Math.round(amount).toLocaleString("es-CL")}`
