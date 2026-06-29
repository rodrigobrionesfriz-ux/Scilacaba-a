# Módulo: Terreno (offline) — Conteos / Inventario de huerto / Estimación

**Fase**: 7 (dividida en 7a/7b/7c) · **Estado**: 7a HECHO (código + tests; e2e/manual por el usuario pendiente)
**Ubicación**: capas técnicas (ADR-013): `src/app/(app)/terreno/`, `src/server/conteos/`, `src/lib/terreno-db.ts`, `src/{types,schemas,constants,utils}/...`

Único dominio **offline** de la app (ADR-003): se captura en campo sin señal (IndexedDB/Dexie) y se sube diferido ("Subir a la nube") con upsert por `id` en Postgres. PWA (serwist/Turbopack) para instalabilidad + shell offline.

## Sub-fases

- **7a (HECHO)** — Fundación offline (Dexie) + PWA (serwist) + sync + módulo **Conteos**.
- **7b (PENDIENTE)** — Inventario de huerto (`invplantas`): captura por hilera (principal/polinizante), secuencia/zigzag, GPS interpolado, edición de estados, mapa 2D.
- **7c (PENDIENTE)** — Estimación de cosecha (`estimaciones`): `centros × frutos/centro × kg/fruto × nº plantas`; plantas productivas equivalentes ponderadas por estado de planta.

## Alcance 7a (qué replica del original)

- **Conteos en terreno** (`index.html` ~9679–10342, `renderConteos`): iniciar sesión (paño + variedad + etapa fenológica), contar árboles (fijos + al azar) con centros florales y GPS opcional, finalizar → guardado **local**. Listado local con estado 📱 Local / ☁️ Sincronizado e indicador online/offline; botón "Subir a la nube" (sync diferido). Vista de revisión consolidada (nube) para `conteos.revisar`.
- **NO cubre en 7a**: estimación, invplantas, export Excel (→ Fase 10), shell "kiosko" para `opconteos` (el sidebar ya restringe por permiso).

## Infraestructura offline / PWA (fundación, reusable por 7b/7c)

- **Dexie** `src/lib/terreno-db.ts`: DB `SCI_TERRENO` v1, tabla `conteos` (PK `id`, índice `fechaInicio`). Helpers: `guardarConteoLocal`, `listarConteosLocales`, `conteosPendientes`, `marcarSincronizados`, `eliminarConteoLocal`. `sincronizado` no se indexa (IndexedDB no indexa booleanos) → pendientes por filtro. 7b añade tabla `invplantas` con bump de versión.
- **PWA serwist (Turbopack)**: `next.config.ts` envuelto con `withSerwist` (marca esbuild como external); SW en `src/app/sw.ts` (`Serwist` + `defaultCache`, NetworkFirst de navegación → shell de rutas visitadas disponible offline); route handler `src/app/[path]/route.ts` (`createSerwistRoute`, esbuild nativo) sirve `/sw.js` (SSG, `dynamicParams:false` → no intercepta otras rutas); registro vía `SerwistProvider` en `src/app/layout.tsx` (deshabilitado en dev); `src/app/manifest.ts` (instalable). Deps: `dexie`, `dexie-react-hooks`, `serwist`, `@serwist/turbopack`, `esbuild`, `@serwist/window`.

## Modelo de datos (tablas Drizzle — ya migradas en Fase 1, sin migración nueva)

- `conteos` (`src/db/schema/terreno.ts`): PK `id` (text), `panoId` (bigint, relación lógica sin FK), `panoNombre/variedad/especie/etapa`, `fijosCodigos` (text[]), `usuario`, `arboles` (jsonb verbatim), `promedioCentros` (numeric 18,4), `nArboles` (int), `sincronizado` (bool), `fechaInicio/fechaFin/fechaSync/updatedAt` (timestamptz).

## Server Actions / Queries (`src/server/conteos/`)

| Fn | Entrada (zod) | Permiso | Efectos | Revalida |
|----|---------------|---------|---------|----------|
| `sincronizarConteos` (action) | `sincronizarConteosSchema` (array) | `conteos.ver` | **upsert por `id`** (idempotente, no duplica), recalcula `promedioCentros`/`nArboles` en servidor, sella `fechaSync`/`sincronizado=true`; devuelve `{ok, ids}` | `/terreno/conteos` |
| `getConteos` (query) | — | (lectura) | lista conteos sincronizados (Postgres), numeric→number, fechas→ISO | — |

## Lógica de dominio (`src/utils/conteos.utils.ts`, pura + testeada)

- `promedioCentros`, `narrowArbol`/`narrowArboles` (narrowing del blob jsonb sin `as`), `resumenConteo`, `formatGps`. Fuente de verdad compartida por la captura (preview en vivo) y la action (cálculo autoritativo).

## UI (`src/app/(app)/terreno/`)

- `layout.tsx` (`requireAuth` + `TerrenoTabs`) → `conteos/page.tsx` (≤20L, compone) → `(sections)`: `conteos.view` (server, guard `conteos.ver`, trae nube+paños), `conteos.capture` (cliente offline-first: flujo inicio→sesión, contador de centros, tipo fijo/aleatorio, GPS), `conteos.local-list` (Dexie `useLiveQuery` + sync + indicador online), `conteos.table`/`columns` (revisión nube, reusa `DataTable`).
- Nav: `navegacion.constants.ts` → hrefs `/terreno/*`; `conteos` `disponible:true` (7a), `invplantas` `false` (7b).

## Reglas de negocio (lo no obvio)

- Offline-first: la captura **nunca** llama Server Actions; escribe en Dexie. La subida es el único punto online (upsert idempotente por `id`).
- `especie` por defecto "Cerezo"; códigos de árbol: fijos `F1/F2/F3` (luego `F4…`), al azar `Azar N`.
- El cuaderno/terreno **no descuenta stock**.

## Checklist de verificación end-to-end

- [ ] Login `agronomo`/`opconteos` → `/terreno/conteos` visible en sidebar.
- [ ] (DevTools offline) Iniciar conteo (paño+etapa), agregar árboles con centros (+/−) y GPS → "Finalizar" → queda 📱 Local; persiste tras refresh.
- [ ] Reconectar → "Subir a la nube" → pasa a ☁️ Sincronizado y aparece en la tabla de revisión (nube). Re-subir no duplica (upsert por `id`).
- [ ] `gerente`/`consulta` sin `conteos.ver` → redirigidos / no ven el módulo. `agronomo` ve la tabla de revisión (`conteos.revisar`).
- [ ] PWA: manifest válido, SW registrado (prod), app instalable, shell de `/terreno/*` carga offline.
- [x] typecheck / lint / 150 tests / build verdes (SW compila: 66 precache entries).

## Evidencia de verificación

- 7a: `pnpm typecheck` ✓, `pnpm lint` ✓, `pnpm test` 150 ✓, `pnpm build` ✓ (serwist: 66 precache entries, 2065 KiB; `/sw.js` SSG; `/terreno/conteos` dynamic). e2e/manual por el usuario pendiente.
