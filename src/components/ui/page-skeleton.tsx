import { cn } from "@/lib/utils"

// Skeleton genérico de página (fallback de Suspense vía loading.tsx). Imita el
// encabezado + bloques de contenido de una vista para dar feedback inmediato
// mientras el server component hace streaming. UI compartida, no vendored.
export const PageSkeleton = ({ className }: { className?: string }) => (
  <div
    className={cn("flex animate-pulse flex-col gap-6", className)}
    aria-hidden
  >
    <div className="flex flex-col gap-2">
      <div className="h-8 w-64 rounded-md bg-muted" />
      <div className="h-4 w-96 max-w-full rounded bg-muted/60" />
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 rounded-xl border bg-muted/40" />
      ))}
    </div>
    <div className="h-80 rounded-xl border bg-muted/30" />
  </div>
)
