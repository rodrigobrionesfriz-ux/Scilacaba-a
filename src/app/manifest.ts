import type { MetadataRoute } from "next"

// Web App Manifest (PWA). Hace la app instalable; el shell de terreno funciona
// offline vía el service worker (ADR-003).
const manifest = (): MetadataRoute.Manifest => ({
  name: "SCI · La Cabaña",
  short_name: "SCI",
  description: "Sistema de Control de Inventario — La Cabaña",
  start_url: "/dashboard",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#1e8449",
  icons: [
    {
      src: "/logo-la-cabana.png",
      sizes: "any",
      type: "image/png",
      purpose: "any",
    },
  ],
})

export default manifest
