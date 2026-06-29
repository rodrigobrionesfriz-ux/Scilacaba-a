import { withSerwist } from "@serwist/turbopack"
import type { NextConfig } from "next"

// PWA (ADR-003): solo los módulos de terreno necesitan funcionar offline. serwist
// (Turbopack) construye el service worker desde src/app/sw.ts y lo sirve en /sw.js
// vía el route handler src/app/[path]/route.ts. withSerwist solo marca esbuild como
// paquete externo del servidor.
const nextConfig: NextConfig = {}

export default withSerwist(nextConfig)
