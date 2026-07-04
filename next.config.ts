import { withSerwist } from "@serwist/turbopack"
import type { NextConfig } from "next"
// Import relativo (no alias @/): next.config lo carga Node, donde el alias de
// tsconfig no resuelve.
import { SECURITY_HEADERS } from "./src/constants/security.constants"

// PWA (ADR-003): solo los módulos de terreno necesitan funcionar offline. serwist
// (Turbopack) construye el service worker desde src/app/sw.ts y lo sirve en /sw.js
// vía el route handler src/app/[path]/route.ts. withSerwist solo marca esbuild como
// paquete externo del servidor.
const nextConfig: NextConfig = {
  // Security headers (Fase 12, hardening) en todas las rutas. Aditivos: no pisan
  // los headers propios del route handler del SW (Service-Worker-Allowed, etc.).
  headers: async () => [
    {
      source: "/(.*)",
      headers: SECURITY_HEADERS,
    },
  ],
}

export default withSerwist(nextConfig)
