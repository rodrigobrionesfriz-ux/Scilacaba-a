// Formatea un monto como pesos chilenos: 1000 -> "$1.000".
export const formatCLP = (amount: number): string =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount)
