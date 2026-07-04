import { PageSkeleton } from "@/components/ui/page-skeleton"

// Fallback de Suspense para todo el grupo (app): Next envuelve las páginas hijas
// en un boundary y muestra este skeleton al instante mientras el contenido
// (queries del server component) llega por streaming.
const Loading = () => <PageSkeleton />

export default Loading
