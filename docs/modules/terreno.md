# Módulo: Terreno (offline) — Conteos / Inventario de huerto / Estimación

**Fase**: 7 (dividida en 7a/7b/7c) · **Estado**: 7a y 7b HECHO (código + tests; e2e/manual por el usuario pendiente)
**Ubicación**: capas técnicas (ADR-013): `src/app/(app)/terreno/`, `src/server/{conteos,invplantas}/`, `src/lib/terreno-db.ts`, `src/{types,schemas,constants,utils}/...`

Único dominio **offline** de la app (ADR-003): se captura en campo sin señal (IndexedDB/Dexie) y se sube diferido ("Subir a la nube") con upsert por `id` en Postgres. PWA (serwist/Turbopack) para instalabilidad + shell offline.

## Sub-fases

- **7a (HECHO)** — Fundación offline (Dexie) + PWA (serwist) + sync + módulo **Conteos**.
- **7b (HECHO)** — Inventario de huerto (`invplantas`): captura por hilera (principal/polinizante), secuencia/zigzag, GPS interpolado, mapa 2D + edición (estados + insertar/eliminar), resumen por cuartel con write-back al Cuaderno.
- **7c (PENDIENTE)** — Estimación de cosecha (`estimaciones`): `centros × frutos/centro × kg/fruto × nº plantas`; plantas productivas equivalentes ponderadas por estado de planta.

## Alcance 7b — Inventario de huerto (qué replica del original)

Espejo de `index.html` ~10345–11716 (`renderInvPlantas`). **Captura offline** (espejo de Conteos): por hilera, con **doble contador** (variedad principal 🌳 / polinizante 🐝), **estado por planta** elegido antes de sumar (sano/débil/muerto/replante/falta), GPS de inicio y fin de hilera; `secuencia[]` es la fuente de verdad. Guardado **local** (Dexie) + lista con estado 📱 Local / ☁️ Sincronizado + "Subir a la nube".

**Decisión de arquitectura**: el **mapa 2D + edición viven en el lado revisión (nube)**, operando sobre datos sincronizados vía Server Actions (las semánticas de permiso lo definen: `revisar` = ver mapa, `editar` = editar en el mapa). La captura no renderiza mapa local. **`plantas[]` se genera autoritativamente en el servidor** al sincronizar (igual que Conteos recalcula promedio/nArboles), desde `secuencia + gpsInicio + gpsFin + hilera + codigoBase`.

- **Zigzag**: las hileras **pares** se recorren al revés → la secuencia se invierte antes de numerar para que la planta #1 sea la posición física correcta (`generarPlantas`).
- **GPS interpolado**: cada planta recibe lat/lng interpolado por su fracción de avance entre los extremos.
- **Código**: base `C1REGH1` (`generarCodigoBase`: cuartel+abrev. variedad+hilera) + por planta `C1REGH1-000001`.
- **Mapa 2D**: grilla de círculos (44px), color por estado, borde por tipo (principal gris / poliniz naranja), número = secuencia.
- **Edición** (`invplantas.editar`, admin): cambiar estado de una planta; **insertar/eliminar** plantas (renumera/recodifica/reinterpola GPS de la hilera, `renumerarRecodificar`).
- **Resumen por cuartel** (`invplantas.revisar`): agrega por cuartel+variedad (hileras, total, principal/poliniz, desglose por estado) y compara con el Cuaderno; botón "Actualizar paño a N plantas" (`cuaderno.panos`) escribe `panos.plantas` (`actualizarPanoPlantas` en `panos.actions`).
- **NO cubre 7b**: Excel (resumen + detalle con links a Maps) → Fase 10; estimación → 7c.

## Alcance 7a (qué replica del original)

- **Conteos en terreno** (`index.html` ~9679–10342, `renderConteos`): iniciar sesión (paño + variedad + etapa fenológica), contar árboles (fijos + al azar) con centros florales y GPS opcional, finalizar → guardado **local**. Listado local con estado 📱 Local / ☁️ Sincronizado e indicador online/offline; botón "Subir a la nube" (sync diferido). Vista de revisión consolidada (nube) para `conteos.revisar`.
- **NO cubre en 7a**: estimación, invplantas, export Excel (→ Fase 10), shell "kiosko" para `opconteos` (el sidebar ya restringe por permiso).

## Infraestructura offline / PWA (fundación, reusable por 7b/7c)

- **Dexie** `src/lib/terreno-db.ts`: DB `SCI_TERRENO` **v2**, tablas `conteos` e `invplantas` (PK `id`, índice `fechaInicio`). Helpers de conteos (`guardarConteoLocal`…) + de invplantas (`guardarInvplantaLocal`, `listarInvplantasLocales`, `invplantasPendientes`, `marcarInvplantasSincronizadas`, `eliminarInvplantaLocal`). `sincronizado` no se indexa (IndexedDB no indexa booleanos) → pendientes por filtro. El bump v1→v2 conserva los datos existentes.
- **PWA serwist (Turbopack)**: `next.config.ts` envuelto con `withSerwist` (marca esbuild como external); SW en `src/app/sw.ts` (`Serwist` + `defaultCache`, NetworkFirst de navegación → shell de rutas visitadas disponible offline); route handler `src/app/[path]/route.ts` (`createSerwistRoute`, esbuild nativo) sirve `/sw.js` (SSG, `dynamicParams:false` → no intercepta otras rutas); registro vía `SerwistProvider` en `src/app/layout.tsx` (deshabilitado en dev); `src/app/manifest.ts` (instalable). Deps: `dexie`, `dexie-react-hooks`, `serwist`, `@serwist/turbopack`, `esbuild`, `@serwist/window`.

## Modelo de datos (tablas Drizzle — ya migradas en Fase 1, sin migración nueva)

- `conteos` (`src/db/schema/terreno.ts`): PK `id` (text), `panoId` (bigint, relación lógica sin FK), `panoNombre/variedad/especie/etapa`, `fijosCodigos` (text[]), `usuario`, `arboles` (jsonb verbatim), `promedioCentros` (numeric 18,4), `nArboles` (int), `sincronizado` (bool), `fechaInicio/fechaFin/fechaSync/updatedAt` (timestamptz).
- `invplantas` (`src/db/schema/terreno.ts`): PK `id` (text), `cuartelId` (bigint), `cuartel/variedad/portainjerto/polinizante/hilera/codigoBase/usuario`, `countPrincipal/countPoliniz` (int), `secuencia` (jsonb heterogéneo), `gpsInicio/gpsFin` (jsonb), `plantas` (jsonb verbatim `{seq,codigo,tipo,estado,lat,lng}`), `sincronizado` (bool), `fechaInicio/fechaSync/updatedAt`.

## Server Actions / Queries

`src/server/conteos/`:

| Fn | Entrada (zod) | Permiso | Efectos | Revalida |
|----|---------------|---------|---------|----------|
| `sincronizarConteos` (action) | `sincronizarConteosSchema` (array) | `conteos.ver` | **upsert por `id`** (idempotente, no duplica), recalcula `promedioCentros`/`nArboles` en servidor, sella `fechaSync`/`sincronizado=true`; devuelve `{ok, ids}` | `/terreno/conteos` |
| `getConteos` (query) | — | (lectura) | lista conteos sincronizados (Postgres), numeric→number, fechas→ISO | — |

`src/server/invplantas/`:

| Fn | Entrada (zod) | Permiso | Efectos | Revalida |
|----|---------------|---------|---------|----------|
| `sincronizarInvplantas` (action) | `sincronizarInvplantasSchema` (array) | `invplantas.ver` | **upsert por `id`**; **genera `plantas[]`** (zigzag + GPS interpolado) y recalcula contadores en servidor; sella `fechaSync`/`sincronizado=true`; devuelve `{ok, ids}` | `/terreno/invplantas` |
| `editarEstadoPlanta` (action) | `editarEstadoSchema` | `invplantas.editar` | cambia el `estado` de la planta `seq` en el jsonb | `/terreno/invplantas` |
| `insertarPlanta` / `eliminarPlanta` (action) | `insertar`/`eliminarPlantaSchema` | `invplantas.editar` | modifica el array, **renumera/recodifica/reinterpola** GPS + recalcula contadores | `/terreno/invplantas` |
| `getInvplantas` (query) | — | (lectura) | lista hileras sincronizadas con `plantas` narrowed (para mapa + resumen sin otra query) | — |
| `actualizarPanoPlantas` (`panos.actions`) | `actualizarPanoPlantasSchema` | `cuaderno.panos` | write-back: `UPDATE panos SET plantas` | `/cuaderno/panos`, `/terreno/invplantas` |

## Lógica de dominio (pura + testeada)

- `src/utils/conteos.utils.ts`: `promedioCentros`, `narrowArbol`/`narrowArboles`, `resumenConteo`, `formatGps`.
- `src/utils/invplantas.utils.ts`: `generarCodigoBase`/`abrevVariedad`, `recalcularContadores`, `esHileraInvertida`, **`generarPlantas`** (zigzag + interpolación GPS), **`renumerarRecodificar`** (insertar/eliminar), `narrowGps`/`narrowPlanta`/`narrowPlantas` (jsonb sin `as`), `desgloseEstados`, `resumenPorPano`. Fuente de verdad compartida por la captura, la action (autoritativa) y el mapa/resumen.

## UI (`src/app/(app)/terreno/`)

- Conteos: `conteos/page.tsx` → `(sections)`: `conteos.{view,capture,local-list,table,columns}`.
- Invplantas: `invplantas/page.tsx` (≤20L) → `(sections)`: `invplantas.view` (server, guard `invplantas.ver`, trae nube+cuarteles), `invplantas.capture` (cliente offline-first: inicio→conteo, doble contador + selector de estado + GPS inicio/fin, prefill de hilera siguiente), `invplantas.local-list` (Dexie `useLiveQuery` + sync), `invplantas.table`/`columns` (revisión nube; columna "Ver mapa"), `invplantas.map` (mapa 2D + edición admin), `invplantas.resumen` (agregado por cuartel + actualizar Cuaderno). Mapa/edición/resumen solo si `invplantas.revisar`/`editar`/`cuaderno.panos`.
- Nav: `navegacion.constants.ts` → hrefs `/terreno/*`; `conteos` e `invplantas` `disponible:true`. `TABS_TERRENO` con ambas pestañas.

## Reglas de negocio (lo no obvio)

- Offline-first: la captura **nunca** llama Server Actions; escribe en Dexie. La subida es el único punto online (upsert idempotente por `id`).
- Conteos: `especie` por defecto "Cerezo"; árboles fijos `F1/F2/F3` (luego `F4…`), al azar `Azar N`.
- Invplantas: `secuencia[]` (orden de caminata) es la fuente de verdad; los contadores y `plantas[]` se derivan. **Zigzag**: hileras pares se invierten antes de numerar. Mapa + edición = lado nube (no local); las acciones de admin renumeran/recodifican/reinterpolan toda la hilera.
- El cuaderno/terreno **no descuenta stock**.

## Checklist de verificación end-to-end

Conteos (7a):
- [ ] Login `agronomo`/`opconteos` → `/terreno/conteos` visible. (DevTools offline) iniciar conteo, agregar árboles + GPS → "Finalizar" → 📱 Local, persiste tras refresh. Reconectar → "Subir" → ☁️ Sincronizado; re-subir no duplica.

Invplantas (7b):
- [ ] Login `opconteos`/`agronomo` → `/terreno/invplantas`. (Offline) "Nueva hilera": cuartel+variedad+hilera → marcar inicio (GPS) → contar 🌳/🐝 con estados → guardar (GPS fin) → 📱 Local, persiste tras refresh.
- [ ] Reconectar → "Subir a la nube" → ☁️ Sincronizado, aparece en la tabla de revisión. Re-subir no duplica (upsert por `id`).
- [ ] `agronomo`/`admin` (`invplantas.revisar`): abrir mapa 2D → puntos por estado, bordes por tipo, zigzag correcto en hilera par. `admin` (`invplantas.editar`): cambiar estado, insertar/eliminar plantas → renumeración/recodificación/reinterpolación.
- [ ] Resumen por cuartel: comparación con Cuaderno; "Actualizar paño a N plantas" actualiza `panos.plantas`.
- [ ] `gerente`/`consulta` sin `invplantas.ver` → no ven el módulo; `opconteos` solo captura (no revisión/mapa).
- [ ] PWA: manifest válido, SW registrado (prod), app instalable, shell de `/terreno/*` carga offline.
- [x] typecheck / lint / 176 tests / build verdes (SW compila: 67 precache entries).

## Evidencia de verificación

- 7a: `pnpm typecheck` ✓, `pnpm lint` ✓, `pnpm test` 150 ✓, `pnpm build` ✓ (serwist: 66 precache entries; `/terreno/conteos` dynamic). e2e/manual por el usuario pendiente.
- 7b: `pnpm typecheck` ✓, `pnpm lint` ✓, `pnpm test` **176** ✓ (+26: invplantas utils/schema), `pnpm build` ✓ (serwist: **67** precache entries, 2106 KiB; `/terreno/invplantas` dynamic). **Sin migración nueva** (tabla ya en Fase 1). e2e/manual por el usuario pendiente.
