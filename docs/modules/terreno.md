# Módulo: Terreno (offline) — Conteos / Inventario de huerto / Estimación

**Fase**: 7 (dividida en 7a/7b/7c) · **Estado**: 7a, 7b y 7c HECHO (código + tests; e2e/manual por el usuario pendiente)
**Ubicación**: capas técnicas (ADR-013): `src/app/(app)/terreno/`, `src/server/{conteos,invplantas,estimaciones}/`, `src/lib/terreno-db.ts`, `src/{types,schemas,constants,utils}/...`

Conteos e Inventario de huerto (7a/7b) son los dos únicos dominios **offline** de la app (ADR-003): se capturan en campo sin señal (IndexedDB/Dexie) y se suben diferido ("Subir a la nube") con upsert por `id` en Postgres. PWA (serwist/Turbopack) para instalabilidad + shell offline. **Estimación de cosecha (7c) es online**: no captura, solo lee datos ya sincronizados de los otros dos.

## Sub-fases

- **7a (HECHO)** — Fundación offline (Dexie) + PWA (serwist) + sync + módulo **Conteos**.
- **7b (HECHO)** — Inventario de huerto (`invplantas`): captura por hilera (principal/polinizante), secuencia/zigzag, GPS interpolado, mapa 2D + edición (estados + insertar/eliminar), resumen por cuartel con write-back al Cuaderno.
- **7c (HECHO)** — Estimación de cosecha (`estimaciones`): `centros × frutos/centro × kg/fruto × nº plantas`; plantas productivas equivalentes ponderadas por estado de planta.

## Alcance 7c — Estimación de cosecha (qué replica del original)

Espejo de la versión Terreno del monolito (`index.html` ~10093–10321, `ctePromedioCentrosPano`/`ctePlantasProductivas`/`cteNuevaEstim`/`cteRenderEstimVer`/`cteGuardarEstim` + pesos `PROD_ESTADO_DEFAULT` ~12475) — no de la versión "Estimación" del Cuaderno (`renderEstimacion` ~14354–14495), que no pondera por estado de planta. **Módulo online, sin captura**: gateado por `conteos.revisar` (ya definido en el catálogo como "revisar conteos: exportar Excel y **aplicar a estimación**"), sin permiso nuevo ni cambio de roles.

- **Calculadora**: una línea por paño, precargada por el servidor con **centros florales** (promedio de `conteos` que matchean por `panoId`) y **plantas productivas equivalentes** (desde `invplantas`, match por `cuartelId === pano.id`): `equiv = Σ (nº plantas del estado × peso%/100)`, redondeado a 1 decimal. Editable por línea: centros, frutos/centro (default `2`), kg/fruto (default `0.011`), nº plantas manual, toggle "usar equivalentes". kg por línea = `centros × frutosCentro × kgFruto × plantasUsadas`; total = suma de líneas (+ cajas de 5 kg, + toneladas).
- **Pesos por estado editables**: editor global (sano/débil/muerto/replante/falta, %) con botón "Aplicar a todas las líneas"; recalcula el equivalente en vivo desde el **desglose crudo** de cada línea (mismo patrón que el resto del módulo: la Server Action no confía en el `plantasEquiv` que manda el cliente, lo recalcula server-side desde `desglose + pesosEstado`). Override por paño ya existente (`panos.prodPct`) se respeta como punto de partida.
- **Guardar versión**: cada "Guardar" crea una nueva versión (`estimaciones`, sin edición in-place desde la calculadora); recalcula `kgPano`/`totalKg` autoritativamente en el servidor.
- **Versiones guardadas**: tabla con nombre/fecha/usuario/total kg + "Ver detalle" (desglose de líneas + totales), "Exportar Excel" (server-side, hoja Resumen + Detalle) y "Eliminar" (confirmación).
- **Export Excel**: primer uso de export en el proyecto (7a/7b lo difirieron a Fase 10). Librería **`exceljs`**, no `xlsx`/SheetJS — la versión de `xlsx` publicada en npm (0.18.5) tiene un ReDoS de severidad alta sin parchear ahí (SheetJS solo publica versiones parchadas vía su propio CDN); `exceljs` no tiene ese problema. Generado en el servidor (base64) → el cliente decodifica a `Blob` y descarga.
- **NO cubre 7c**: edición in-place de una versión guardada; tabla de configuración persistente de pesos por estado (queda como editor de sesión, no se escribe a `panos.prodPct`).

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

## Infraestructura offline / PWA (fundación, reusable por 7b; 7c no la usa — es online)

- **Dexie** `src/lib/terreno-db.ts`: DB `SCI_TERRENO` **v2**, tablas `conteos` e `invplantas` (PK `id`, índice `fechaInicio`). Helpers de conteos (`guardarConteoLocal`…) + de invplantas (`guardarInvplantaLocal`, `listarInvplantasLocales`, `invplantasPendientes`, `marcarInvplantasSincronizadas`, `eliminarInvplantaLocal`). `sincronizado` no se indexa (IndexedDB no indexa booleanos) → pendientes por filtro. El bump v1→v2 conserva los datos existentes.
- **PWA serwist (Turbopack)**: `next.config.ts` envuelto con `withSerwist` (marca esbuild como external); SW en `src/app/sw.ts` (`Serwist` + `defaultCache`, NetworkFirst de navegación → shell de rutas visitadas disponible offline); route handler `src/app/[path]/route.ts` (`createSerwistRoute`, esbuild nativo) sirve `/sw.js` (SSG, `dynamicParams:false` → no intercepta otras rutas); registro vía `SerwistProvider` en `src/app/layout.tsx` (deshabilitado en dev); `src/app/manifest.ts` (instalable). Deps: `dexie`, `dexie-react-hooks`, `serwist`, `@serwist/turbopack`, `esbuild`, `@serwist/window`.

## Modelo de datos (tablas Drizzle — ya migradas en Fase 1, sin migración nueva)

- `conteos` (`src/db/schema/terreno.ts`): PK `id` (text), `panoId` (bigint, relación lógica sin FK), `panoNombre/variedad/especie/etapa`, `fijosCodigos` (text[]), `usuario`, `arboles` (jsonb verbatim), `promedioCentros` (numeric 18,4), `nArboles` (int), `sincronizado` (bool), `fechaInicio/fechaFin/fechaSync/updatedAt` (timestamptz).
- `invplantas` (`src/db/schema/terreno.ts`): PK `id` (text), `cuartelId` (bigint), `cuartel/variedad/portainjerto/polinizante/hilera/codigoBase/usuario`, `countPrincipal/countPoliniz` (int), `secuencia` (jsonb heterogéneo), `gpsInicio/gpsFin` (jsonb), `plantas` (jsonb verbatim `{seq,codigo,tipo,estado,lat,lng}`), `sincronizado` (bool), `fechaInicio/fechaSync/updatedAt`.
- `estimaciones` (`src/db/schema/terreno.ts`): PK `id` (text), `nombre` (text), `usuario`, `lineas` (jsonb verbatim, una entrada por paño), `totalKg` (numeric 18,4), `fecha`/`updatedAt` (timestamptz). **Sin** `sincronizado`/`fechaSync` (a diferencia de `conteos`/`invplantas`) porque no es offline. Ya migrada en Fase 1 (migrador `sci-terreno.ts` ya mapeaba `estimaciones` desde el origen); sin cambios en esta fase.

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

`src/server/estimaciones/`:

| Fn | Entrada (zod) | Permiso | Efectos | Revalida |
|----|---------------|---------|---------|----------|
| `getDatosEstimacion` (query) | — | (lectura) | construye una línea base por paño: centros promedio (match `conteos.panoId === pano.id`) + plantas equivalentes (match `invplantas.cuartelId === pano.id`, pesos = `resolverPesos(pano.prodPct)`) | — |
| `getEstimaciones` (query) | — | (lectura) | lista versiones guardadas, `lineas` narrowed, numeric→number, fechas→ISO | — |
| `guardarEstimacion` (action) | `guardarEstimacionSchema` | `conteos.revisar` | **upsert por `id`** (nuevo si no viene `id`); recalcula `plantasEquiv/plantasInvTotal` desde `desglose+pesosEstado` y `plantasUsadas/kgPano/totalKg` en servidor — no confía en los derivados del cliente | `/terreno/estimacion` |
| `eliminarEstimacion` (action) | `eliminarEstimacionSchema` | `conteos.revisar` | borra la versión | `/terreno/estimacion` |
| `exportarEstimacionExcel` (action) | `eliminarEstimacionSchema` (mismo shape `{id}`) | `conteos.revisar` | genera el workbook (`exceljs`) server-side, devuelve `{base64, filename}` | — |

## Lógica de dominio (pura + testeada)

- `src/utils/conteos.utils.ts`: `promedioCentros`, `narrowArbol`/`narrowArboles`, `resumenConteo`, `formatGps`.
- `src/utils/invplantas.utils.ts`: `generarCodigoBase`/`abrevVariedad`, `recalcularContadores`, `esHileraInvertida`, **`generarPlantas`** (zigzag + interpolación GPS), **`renumerarRecodificar`** (insertar/eliminar), `narrowGps`/`narrowPlanta`/`narrowPlantas` (jsonb sin `as`), `desgloseEstados`, `resumenPorPano`. Fuente de verdad compartida por la captura, la action (autoritativa) y el mapa/resumen.
- `src/utils/estimaciones.utils.ts`: `plantasProductivas` (equivalente ponderado por estado), `kgLinea`, `plantasUsadas`, `totalKgLineas`, `aCajas`/`aToneladas`, `promedioCentrosPano`, `resolverPesos` (override por paño), `narrowDesglose`/`narrowLinea`/`narrowLineas` (jsonb sin `as`). Fuente de verdad compartida por la calculadora (preview en vivo) y la Server Action (cálculo autoritativo).

## UI (`src/app/(app)/terreno/`)

- Conteos: `conteos/page.tsx` → `(sections)`: `conteos.{view,capture,local-list,table,columns}`.
- Invplantas: `invplantas/page.tsx` (≤20L) → `(sections)`: `invplantas.view` (server, guard `invplantas.ver`, trae nube+cuarteles), `invplantas.capture` (cliente offline-first: inicio→conteo, doble contador + selector de estado + GPS inicio/fin, prefill de hilera siguiente), `invplantas.local-list` (Dexie `useLiveQuery` + sync), `invplantas.table`/`columns` (revisión nube; columna "Ver mapa"), `invplantas.map` (mapa 2D + edición admin), `invplantas.resumen` (agregado por cuartel + actualizar Cuaderno). Mapa/edición/resumen solo si `invplantas.revisar`/`editar`/`cuaderno.panos`.
- Estimación: `estimacion/page.tsx` (≤20L) → `(sections)`: `estimacion.view` (server, guard `conteos.revisar`, trae base+versiones), `estimacion.calculator` (cliente: tabla editable por paño + editor global de pesos + guardar), `estimacion.table`/`columns` (versiones guardadas), `estimacion.detalle` (Dialog de solo lectura), `estimacion.exportar` (descarga Excel), `estimacion.delete` (AlertDialog de confirmación).
- Nav: `navegacion.constants.ts` → hrefs `/terreno/*`; `conteos`, `invplantas` y `estimacion` `disponible:true` (ítem `estimacion` gateado por `conteos.revisar`). `TABS_TERRENO` con las 3 pestañas.

## Reglas de negocio (lo no obvio)

- Offline-first: la captura de Conteos/Invplantas **nunca** llama Server Actions; escribe en Dexie. La subida es el único punto online (upsert idempotente por `id`). Estimación es online desde el inicio (no tiene captura).
- Conteos: `especie` por defecto "Cerezo"; árboles fijos `F1/F2/F3` (luego `F4…`), al azar `Azar N`.
- Invplantas: `secuencia[]` (orden de caminata) es la fuente de verdad; los contadores y `plantas[]` se derivan. **Zigzag**: hileras pares se invierten antes de numerar. Mapa + edición = lado nube (no local); las acciones de admin renumeran/recodifican/reinterpolan toda la hilera.
- Estimación: el match paño↔conteos/invplantas es por **id** (`panoId`/`cuartelId === pano.id`), no por nombre+variedad como en el monolito original (que no tenía FK estable) — más robusto dado que el esquema relacional ya garantiza esa referencia. El `desglose` crudo por estado viaja al cliente para poder recalcular el equivalente en vivo al editar pesos, pero la Server Action de guardado **recalcula `plantasEquiv`/`plantasInvTotal` desde ese `desglose` + los `pesosEstado` enviados**, nunca confía en el valor ya agregado que manda el cliente (mismo principio que Conteos/Invplantas: los inputs "en bruto" son de confianza, los derivados se recalculan).
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

Estimación (7c):
- [ ] Login `admin`/`agronomo` → `/terreno/estimacion` visible (permiso `conteos.revisar`); `opconteos` (solo `conteos.ver`) **no** ve el ítem/pestaña.
- [ ] La calculadora precarga centros (desde conteos ya sincronizados) y plantas equivalentes (desde invplantas ya sincronizadas) por paño; editar frutos/centro, kg/fruto y el toggle "usar equivalentes" recalcula el kg de la línea en vivo.
- [ ] Editar los pesos por estado + "Aplicar a todas las líneas" recalcula el equivalente y el kg de cada línea con `desglose` de invplantas.
- [ ] "Guardar estimación" con nombre crea una versión nueva en la tabla; "Ver detalle" muestra el desglose de líneas + totales (kg/cajas/toneladas); re-guardar no pisa versiones anteriores (cada guardado = nueva fila).
- [ ] "Exportar Excel" descarga un `.xlsx` con hoja Resumen + Detalle.
- [ ] "Eliminar" (con confirmación) borra la versión de la tabla.
- [x] typecheck / lint / 209 tests / build verdes (SW compila: 70 precache entries). **Sin migración nueva** (tabla ya en Fase 1).

## Evidencia de verificación

- 7a: `pnpm typecheck` ✓, `pnpm lint` ✓, `pnpm test` 150 ✓, `pnpm build` ✓ (serwist: 66 precache entries; `/terreno/conteos` dynamic). e2e/manual por el usuario pendiente.
- 7b: `pnpm typecheck` ✓, `pnpm lint` ✓, `pnpm test` **176** ✓ (+26: invplantas utils/schema), `pnpm build` ✓ (serwist: **67** precache entries, 2106 KiB; `/terreno/invplantas` dynamic). **Sin migración nueva** (tabla ya en Fase 1). e2e/manual por el usuario pendiente.
- 7c: `pnpm typecheck` ✓, `pnpm lint` ✓, `pnpm test` **209** ✓ (+33: estimaciones utils/schema), `pnpm build` ✓ (serwist: **70** precache entries, 2082 KiB; `/terreno/estimacion` dynamic). **Sin migración nueva** (tabla ya en Fase 1; reusa el permiso `conteos.revisar`, sin cambios a roles/permisos). Dependencia nueva: `exceljs` (no `xlsx`/SheetJS — la versión de `xlsx` en npm tiene un ReDoS de severidad alta sin parche publicado ahí). e2e/manual por el usuario pendiente.
