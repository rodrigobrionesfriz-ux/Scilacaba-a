// Formatea una cantidad (kg, L, dosis, há, aportes, stock…) para mostrar. Locale
// es-CL (coma decimal, punto de miles) como el resto de la app; tope de decimales
// (default 2) — nunca mostramos floats crudos tipo 5.8076534999999865. null/NaN → "—".
export const fmtCantidad = (
  n: number | null | undefined,
  decimals = 2,
): string =>
  n == null || Number.isNaN(n)
    ? "—"
    : n.toLocaleString("es-CL", { maximumFractionDigits: decimals })
