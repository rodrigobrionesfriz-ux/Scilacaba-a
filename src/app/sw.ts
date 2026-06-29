/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker"
import { type PrecacheEntry, type SerwistGlobalConfig, Serwist } from "serwist"

// Service worker de la PWA (ADR-003). esbuild lo compila desde aquí; no es una ruta
// de Next. defaultCache (NetworkFirst para navegaciones) hace que el shell de las
// rutas visitadas — incluido /terreno/* — quede disponible sin conexión.

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()
