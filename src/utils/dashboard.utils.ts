// Lógica pura del dashboard (regla 8). Sin I/O.

// Un producto está bajo mínimo si es inventariable, tiene mínimo definido y su
// existencia total no lo supera (espejo de renderDashboard del monolito).
export const esStockBajo = (
  inventariable: boolean,
  stockMinimo: number,
  stockTotal: number,
): boolean => inventariable && stockMinimo > 0 && stockTotal <= stockMinimo

// Etiqueta de producto para la fila de movimiento: primer producto + "+N" extra.
export const labelProductoMovimiento = (
  primera: string,
  totalLineas: number,
): string => {
  if (totalLineas <= 0 || primera === "") return "—"
  return totalLineas > 1 ? `${primera} +${totalLineas - 1}` : primera
}

// Un lote vence pronto si tiene fecha y cae dentro de [hoy, hoy+dias].
export const loteVencePronto = (
  fechaVenc: string | null,
  hoyMs: number,
  dias: number,
): boolean => {
  if (!fechaVenc) return false
  const venceMs = new Date(fechaVenc).getTime()
  return Number.isFinite(venceMs) && venceMs < hoyMs + dias * 86400000
}
