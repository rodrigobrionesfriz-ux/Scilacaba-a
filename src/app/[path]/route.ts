import { createSerwistRoute } from "@serwist/turbopack"

// Sirve el service worker compilado en /sw.js (ADR-003). createSerwistRoute genera
// estáticamente solo el archivo del SW (dynamicParams: false), así que este route
// handler dinámico no intercepta otras rutas de un solo segmento.
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
  })
