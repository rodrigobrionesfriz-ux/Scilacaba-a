import { cn } from "@/lib/utils"

// Fallback de un panel de gráfico mientras su chunk (recharts) carga por dynamic
// import. Mantiene el layout (aspect-video) para evitar saltos. UI compartida.
export const ChartSkeleton = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "aspect-video w-full animate-pulse rounded-xl border bg-muted/30",
      className,
    )}
    aria-hidden
  />
)
