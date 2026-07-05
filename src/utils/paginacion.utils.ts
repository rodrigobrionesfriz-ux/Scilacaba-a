import { PAGINAS_ALREDEDOR } from "@/constants/tabla.constants"

export type ItemPagina = number | "ellipsis"

// Calcula la secuencia de botones de una paginación numerada, con elipsis para los
// huecos. Siempre incluye la primera y la última página; muestra `alrededor` vecinos
// a cada lado de la actual. La elipsis solo aparece cuando oculta más de una página
// (si el hueco es de una sola, se muestra esa página en su lugar).
// Ej.: rangoPaginas(5, 10) => [1, "ellipsis", 4, 5, 6, "ellipsis", 10]
export const rangoPaginas = (
  actual: number,
  total: number,
  alrededor = PAGINAS_ALREDEDOR,
): ItemPagina[] => {
  if (total <= 0) return []

  const clamp = Math.min(Math.max(actual, 1), total)
  const maxVisible = 2 * alrededor + 5
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const left = Math.max(2, clamp - alrededor)
  const right = Math.min(total - 1, clamp + alrededor)

  const items: ItemPagina[] = [1]
  if (left > 2) {
    items.push(left - 2 > 1 ? "ellipsis" : 2)
  }
  for (let p = left; p <= right; p++) {
    items.push(p)
  }
  if (right < total - 1) {
    items.push(total - 1 - right > 1 ? "ellipsis" : total - 1)
  }
  items.push(total)

  return items
}
