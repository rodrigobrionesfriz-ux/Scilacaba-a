# DECISIONS — ADRs de SCI v2

Registro de decisiones de arquitectura (Architecture Decision Records). Una entrada por decisión: contexto, decisión y consecuencias. No se reescriben; si una decisión se revierte, se añade una nueva que la supersede.

---

## ADR-001 — Stack: Next.js + TypeScript + Server Actions + Postgres + Drizzle
**Fecha**: 2026-06-25 · **Estado**: aceptada
**Contexto**: El monolito es vanilla JS sin tipos, build ni tests. Se necesita un stack mantenible y tipado.
**Decisión**: Next.js (App Router) + TypeScript, mutaciones vía Server Actions, persistencia en Postgres con Drizzle ORM.
**Consecuencias**: Tipado end-to-end; SSR; sin API REST manual. Server Actions son online por naturaleza → ver ADR-003 para offline.

## ADR-002 — Reescritura completa (no incremental)
**Fecha**: 2026-06-25 · **Estado**: aceptada
**Contexto**: El monolito mezcla capas, tiene XSS, funciones de 400-700 líneas y O(N²). Modularizar in situ daría poco retorno.
**Decisión**: Reescribir desde cero, usando el `index.html` original como especificación de funcionalidad. Preservar el 100% de las features.
**Consecuencias**: Mayor esfuerzo inicial; riesgo de regresión mitigado con tests y checklists por módulo. El monolito se conserva como referencia.

## ADR-003 — Offline híbrido (solo módulos de terreno)
**Fecha**: 2026-06-25 · **Estado**: aceptada
**Contexto**: Server Actions requieren conexión. El uso en terreno (conteos GPS, inventario de huerto) ocurre a veces sin señal. El monolito ya separa estos módulos (captura local + botón "Subir a la nube").
**Decisión**: Toda la app es online vía Server Actions, EXCEPTO Conteos e Inventario de huerto, que capturan offline en IndexedDB (Dexie) + cola de mutaciones + subida diferida. PWA precachea solo la shell de `/terreno/*`.
**Consecuencias**: Complejidad offline acotada a 2 pantallas. No generalizar la cola a otros módulos.

## ADR-004 — Auth con better-auth; role/permissions en `users`
**Fecha**: 2026-06-25 · **Estado**: aceptada
**Contexto**: El monolito tiene password admin hardcodeada (`admin123`) y Firebase Auth anónimo. Hay 6 roles y ~38 permisos granulares.
**Decisión**: better-auth (adapter Drizzle) gestiona identidad/sesión; `role` y `permissions[]` viven en la tabla de dominio `users` enlazada a `auth_user`. Usuarios migrados sin password → set-password en primer login.
**Consecuencias**: Elimina credenciales hardcodeadas. Autorización en Server Actions vía `can(user, permiso)`.

## ADR-005 — Hosting en Railway
**Fecha**: 2026-06-25 · **Estado**: aceptada
**Decisión**: Postgres y app en Railway (el usuario ya tiene cuenta). Config vía `DATABASE_URL`.
**Consecuencias**: Migraciones Drizzle en el release. Diseñar agnóstico a proveedor por si se migra.

## ADR-006 — Screaming Architecture modular
**Fecha**: 2026-06-25 · **Estado**: ~~aceptada~~ **SUPERSEDIDA por ADR-013** (2026-06-26)
**Contexto**: Se descartó organizar por capas técnicas (`lib/db`, `lib/domain`...) porque "grita el framework", no el negocio.
**Decisión**: Estructura por dominio: `src/modules/<modulo>/{domain,data,actions,ui,index.ts}`. `app/` es routing fino; `src/shared/` es el kernel transversal. Layering interno **pragmático** (domain/data/actions/ui), no hexagonal estricto.
**Consecuencias**: Regla de dependencias `app → modules (vía index.ts) → shared`; un módulo no importa internals de otro. Vigilado por lint de boundaries.
**Reversión**: el usuario optó (2026-06-26, durante Fase 0) por una estructura **por capas técnicas** bajo `src/`. Ver ADR-013.

## ADR-007 — Git-flow con rama `develop`
**Fecha**: 2026-06-25 · **Estado**: aceptada
**Decisión**: `develop` es la rama de integración (creada desde `origin/main`). Cada fase sale de `develop` con `feat/fase-<n>-<modulo>` y vuelve por PR a `develop`. `main` solo para releases a producción.
**Consecuencias**: `main` siempre desplegable. Commits convencionales `feat(modulo): ...`.

## ADR-008 — PPP en función pura única compartida
**Fecha**: 2026-06-25 · **Estado**: aceptada
**Contexto**: El costeo PPP es el corazón del sistema y la fuente más probable de regresiones.
**Decisión**: La lógica de PPP vive en una función pura sin I/O (tras ADR-013: `src/lib/ppp.ts`) y la usan tanto la Server Action `crearMovimiento` (`src/server/movimientos/movimientos.actions.ts`) como el migrador. Cobertura de tests alta y obligatoria.
**Consecuencias**: Un solo lugar testeado para ENT/SAL/TRASPASO/lotes.

## ADR-009 — IDs determinísticos de lotes (recálculo idempotente)
**Fecha**: 2026-06-25 · **Estado**: aceptada (hereda el fix `recalc-lotes-duplicados` de `origin/main` db78096)
**Contexto**: En el monolito el recálculo creaba lotes con `uid()` aleatorio; al ser `lots` un store acumulativo que se fusiona por id, la nube reinyectaba los viejos y el saldo se inflaba. El fix usó id determinístico `lot|cod|bod|lote` + tombstones.
**Decisión**: En Postgres, `lots` tiene unique `(codigo_interno, bodega_id, lote)`; el recálculo reescribe el mismo registro (idempotente). El `stock` se reconstruye desde `movement_lines`. No se replica el mecanismo de tombstones (no hay sync de doc único en v2).
**Consecuencias**: Recálculo idempotente por diseño relacional, sin la complejidad de lápidas.

## ADR-010 — Migración desde 3 docs Firestore (no del backup JSON)
**Fecha**: 2026-06-25 · **Estado**: aceptada
**Contexto**: El backup JSON local de la app omite 4 stores (`mantenciones, conteos, estimaciones, invplantas`) y el cuaderno. El cuaderno vive en un doc Firestore aparte.
**Decisión**: El migrador lee los 3 docs Firestore: `sci/main` (18 stores), `cuaderno/main` (paños, registros, órdenes, fertirriego...) y `presupuesto/main`. Validación de integridad: conteos por entidad + stock recalculado == stock origen (±0.0001).
**Consecuencias**: Migración completa y verificable. Requiere acceso firebase-admin o export manual de los 3 docs.

## ADR-011 — Reafirmación de Postgres sobre Firestore como base de datos
**Fecha**: 2026-06-25 · **Estado**: aceptada (reconsideración explícita de ADR-001)
**Contexto**: Se reabrió la pregunta de si mantener Firestore como base de datos (cero migración de plataforma, offline/real-time nativos, menos infra) vs migrar a Postgres.
**Decisión**: Migrar a **Postgres + Drizzle**. El dominio (inventario/contabilidad con costeo PPP, lotes, ajustes, correlativos sin huecos, reportes con agregaciones) es relacional y transaccional — el caso canónico de SQL. El patrón actual de Firestore (toda la BD en un único documento JSON) es un anti-patrón a corregir, no a preservar. El único punto fuerte de Firestore (offline gratis) ya está cubierto por la decisión de offline híbrido (ADR-003): solo importa en 2 módulos de terreno, resueltos con Dexie. La migración es un evento único y ya tiene migrador verificable (ADR-010).
**Alternativa descartada**: Firestore bien modelado (colecciones reales) — descartada por pérdida de joins, transacciones SQL, integridad referencial y tipado Drizzle, que el negocio necesita.

## ADR-013 — Arquitectura por capas técnicas (supersede ADR-006)
**Fecha**: 2026-06-26 · **Estado**: aceptada (supersede ADR-006)
**Contexto**: Durante Fase 0, el usuario definió 14 reglas de código/estructura (ver `docs/CONVENTIONS.md`). Las reglas 6–13 imponen una organización **por capas técnicas** bajo `src/`, incompatible con la screaming-modular de ADR-006. El prompt original pedía "respetar" la modular, pero la instrucción explícita del usuario manda.
**Decisión**: Estructura por capas bajo `src/`:
- `src/app/<ruta>/page.tsx` (server component, ≤20 líneas, compone) + `src/app/<ruta>/(sections)/<ruta>.*.tsx` (componentes de ruta).
- `src/server/<entidad>/<entidad>.actions.ts` (Server Actions) y `.queries.ts` (lecturas).
- `src/components/ui/` (componentes compartidos / shadcn), `src/hooks/`.
- `src/lib/utils.ts` (utils comunes: `cn`), `src/utils/<entidad>.utils.ts` (utils por entidad).
- `src/types/<entidad>.types.ts`, `src/schemas/<entidad>.schema.ts` (zod), `src/constants/<entidad>.constants.ts`.
- `src/db/` (Drizzle client + schema), antes `src/shared/db`.
**Consecuencias**: Se eliminan `src/modules` y `src/shared`. El lint de boundaries (`eslint-plugin-boundaries`, rule `boundaries/dependencies`) ahora vigila la **dirección entre capas** (UI no es importada por capas inferiores; el acceso a datos pasa por `server`; las hojas no importan hacia arriba). El detalle de las 14 reglas vive en `docs/CONVENTIONS.md`. La formalización de las reglas de estilo como lint/skills se hace en sesión posterior a Fase 0.
**Alternativa descartada**: Mantener screaming-modular y meter las capas dentro de cada módulo — descartada porque las reglas del usuario referencian rutas `src/<capa>` absolutas.

## ADR-012 — shadcn/ui (+ Tailwind + Radix) como capa de UI
**Fecha**: 2026-06-25 · **Estado**: aceptada (confirmación)
**Contexto**: shadcn/ui no es una librería instalable sino componentes copiados al repo, construidos sobre Tailwind CSS + Radix UI.
**Decisión**: Usar shadcn/ui como base de componentes; implica Tailwind por debajo (van juntos). Los componentes viven en `src/shared/ui/` bajo control del repo.
**Consecuencias**: Sin dependencia de una librería de estilos externa monolítica; máximo control y personalización de los ~236 estilos del monolito original.

## ADR-014 — recharts + shadcn `chart` como capa de gráficos
**Fecha**: 2026-07-02 · **Estado**: aceptada (Fase 9)
**Contexto**: El monolito usa Chart.js. La Fase 9 (Presupuesto) es el primer módulo con gráficos (evolución mensual, por tipo/sub-grupo/descripción, desviación). El SPEC ya listaba **recharts** como la librería de gráficos.
**Decisión**: Usar **recharts** (3.8.0) vía el componente vendored `src/components/ui/chart.tsx` de shadcn (`ChartContainer`/`ChartTooltip`/`ChartTooltipContent`), instalado con `pnpm dlx shadcn add chart`. Los datos de cada serie se computan en `src/utils/presupuesto.utils.ts` (puro, testeado); los componentes de gráfico solo pintan. `chart.tsx`/`tabs.tsx` son vendored → pueden usar `function` (excepción de la regla 1).
**Consecuencias**: +recharts en `dependencies`. El bundle del cliente crece (SW precache ~2557 KiB). Los futuros dashboards reutilizan `ChartContainer`. Verificado con React 19.2 / Next 16.2.9 (build verde).

## ADR-015 — PDF con `@react-pdf/renderer` (server-side)
**Fecha**: 2026-07-03 · **Estado**: aceptada (Fase 10)
**Contexto**: El SPEC lista `@react-pdf/renderer` como generador de PDFs. El monolito, en cambio, no usa ninguna librería PDF: sus 3 reportes imprimibles (`ipImprimirDetalleEstado` L11075 — detalle de plantas por estado; `imprimirAplicacionesPano` L14790 — aplicaciones confirmadas por cuartel; `imprimirPDF` L18703 — dashboard de presupuesto) abren una ventana con HTML y llaman a `window.print()`, delegando el "Guardar como PDF" al navegador. La Fase 10 debe reproducir esos 3 reportes.
**Decisión**: Generar los PDFs en el **servidor con `@react-pdf/renderer`** (`renderToBuffer` → base64 → descarga en cliente, mismo transporte que el Excel), no con impresión del navegador. Se prioriza consistencia de layout y generación server-side sobre la fidelidad literal al mecanismo del monolito (el contenido y datos de los reportes sí se replican).
**Estructura (boundaries)**: los server actions no pueden importar `components` (ADR-013), así que los documentos react-pdf viven en la capa `server` (`src/server/reportes/*.pdf.tsx`, módulos normales — no `"use server"`), y `reportes.actions.ts` (`"use server"`) los renderiza. La transformación de datos a filas es pura y testeable en `src/utils/reportes.utils.ts`.
**Consecuencias**: +`@react-pdf/renderer` (4.5.1) en `dependencies` (bundle mayor; `pnpm audit --prod` sin vulnerabilidades nuevas — a diferencia de `xlsx`/SheetJS, ver Fase 7c). **`recharts` no renderiza en react-pdf** → el PDF de presupuesto es un reporte ejecutivo **tabular** (KPIs + Top Desviaciones + detalle), sin gráficos; pre-renderizar gráficos a imagen queda fuera de alcance. La descarga base64→Blob y el tipo `ExportResult` se comparten con el Excel (`src/lib/descarga.ts`, `src/types/export.types.ts`).

## ADR-016 — Auditoría: helper `registrarAuditoria` cableado en las Server Actions
**Fecha**: 2026-07-03 · **Estado**: aceptada (Fase 11)
**Contexto**: El monolito escribe auditoría desde ~27 sitios con `audit(accion, detalle, referencia)` (index.html:2483). En v2, la tabla `audit` tenía 1707 filas migradas pero **ningún Server Action escribía en ella** → el trail estaba muerto y dejaría de crecer tras el cutover.
**Decisión**: Un helper de capa `server` `registrarAuditoria` (`src/server/audit/audit.core.ts`, no `"use server"`) que insertan las mutaciones tras completarse. La parte pura (`construirEntradaAudit`, `src/utils/audit.utils.ts`) arma la fila; el core añade id (`crypto.randomUUID()`) y fecha. **El helper nunca lanza** (try/catch que solo loguea): una mutación no debe romperse porque la auditoría falle (paridad con el try/catch del monolito).
**Cobertura**: se replica la del monolito en el dominio de inventario (maestros, movimientos, tomas) + los módulos nuevos de esta fase (config, usuarios). Cuaderno/Fertirriego/Terreno/Mantenciones/Presupuesto **no** se auditan (tampoco en el monolito). La vista `/auditoria` es solo admin (`adminOnly`, sin permiso granular — se añadió `requireAdmin()` en `auth.queries`).
**Consecuencias**: cada `crear/editar/anular/...` captura el `usuario` de `requirePermiso(...)` y llama al helper antes de `revalidatePath`. Export Excel de la auditoría reutiliza la infra de Fase 10.

## ADR-017 — Respaldo export-only JSON + tema claro/oscuro (no temas de marca)
**Fecha**: 2026-07-03 · **Estado**: aceptada (Fase 11)
**Contexto**: El monolito hacía backup/restore de todos los stores como JSON (index.html:4434/4552, IndexedDB). En v2 los datos viven en Postgres/Railway, con respaldo a nivel de plataforma (pg_dump / backups de Railway). Un restore destructivo en-app (truncate+insert) sobre una BD relacional es riesgoso y redundante.
**Decisión**: **Solo export** — un botón (admin) que descarga un JSON de todas las tablas de dominio (`src/server/backup/backup.actions.ts`; lista canónica `BACKUP_TABLAS`). **Excluye** `accounts/sessions/verifications` (credenciales/tokens) y `migration_log`. **No hay restore en-app**: la restauración se documenta a nivel Postgres (Fase 12). Además, la sección "Apariencia" del monolito (temas de marca sap/forestal aplicados por CSS) se reinterpreta en v2 como **tema claro/oscuro/sistema** vía `next-themes` (local por dispositivo, alterna la clase `.dark` que ya soporta `globals.css`), en línea con shadcn.
**Consecuencias**: cero código de restore (menor superficie de riesgo). El respaldo comparte `descargarArchivo`/`ExportResult` con Excel/PDF (+`JSON_MIME`). Se cableó `ThemeProvider` en el root layout (`suppressHydrationWarning` en `<html>`).

## ADR-018 — Deploy Railway con Nixpacks + hardening de producción
**Fecha**: 2026-07-04 · **Estado**: aceptada (Fase 12)
**Contexto**: Fases 0-11 completas; faltaba desplegar la app en Railway (ADR-005: 2 environments `develop`/`production`, cada uno con su Postgres) y endurecerla para producción. No había config de deploy, security headers, validación de entorno ni límites de autenticación.
**Decisión — build/deploy**: **Nixpacks** (autodetección nativa de Next.js), no Dockerfile — se prioriza simplicidad y reutilizar `pnpm db:migrate` (drizzle-kit) para la migración de release. `railway.json` fija `startCommand: pnpm start`, `preDeployCommand: pnpm db:migrate` (aplica migraciones **antes** de conmutar tráfico), `healthcheckPath: /api/health`, `restartPolicyType: ON_FAILURE`. No se usa `output: standalone` (innecesario con `next start`; el SW de serwist se compila en build).
**Decisión — hardening**: (1) **Validación de entorno con zod** al arranque — `src/schemas/env.schema.ts` (DATABASE_URL/BETTER_AUTH_SECRET≥32/BETTER_AUTH_URL) + `src/lib/env.ts` (falla temprano y claro); `db/client.ts` y `auth.ts` consumen `env`. (2) **Security headers** en `next.config.ts` (`headers()`, todas las rutas) desde `src/constants/security.constants.ts`: CSP header-based (sin nonce — evita render dinámico global; `'unsafe-inline'` en script/style para el shell de Next; `frame-ancestors 'none'`), HSTS, `nosniff`, `X-Frame-Options`, Referrer/Permissions-Policy (**`geolocation=(self)`** porque Terreno captura GPS). (3) **better-auth**: `trustedOrigins` (CSRF) + `rateLimit` (tope global por IP + regla estricta `/sign-in/username`, storage en **memoria** — 1 instancia Hobby). (4) **Healthcheck** `/api/health` shallow (sin DB) + `src/proxy.ts` excluye `/api` del redirect a `/login`.
**Consecuencias**: el primer build en cada environment exige `DATABASE_URL`/`BETTER_AUTH_*` seteadas (la validación corre en `next build`). El rate limit en memoria se resetea por redeploy y es por-instancia (escalar a réplicas exigiría `storage: "database"` + tabla nueva). CSP con `'unsafe-inline'` reduce protección XSS (aceptable en app interna autenticada; nonce documentado como endurecimiento futuro). `migrate:data`/`seed:auth` ahora dependen transitivamente de `env` vía `db/client` → requieren las 3 vars presentes en `.env` (ya lo están). El restore de backup (ADR-017) se documenta a nivel Postgres en el runbook (`docs/modules/deploy-railway.md`).

## ADR-019 — UI responsive / mobile-first adaptativo
**Fecha**: 2026-07-05 · **Estado**: aceptada (Fase 13)
**Contexto**: La app se construyó desktop-first: shell de dos columnas rígidas con sidebar fijo `w-60 shrink-0` sin colapso ni hamburguesa (`src/app/(app)/(sections)/app.sidebar.tsx`), `src/app/layout.tsx` sin `export const viewport`, ningún hook de media query (no existía `src/hooks/`), tablas solo con scroll horizontal (`whitespace-nowrap`) y formularios con `grid-cols-2/3` sin prefijo responsive. La app va a usarse en teléfonos → toda la UI debe ser usable y cómoda en móvil sin degradar la vista desktop.
**Decisión**: **Mobile-first adaptativo** con los breakpoints default de Tailwind (sm 640 / md 768; corte del shell en `md`). (1) **Navegación drawer + hamburguesa**: en `< md` el sidebar se oculta y se abre como overlay desde una hamburguesa en la topbar; en `≥ md` sigue fijo. El árbol `NAV` se extrae a un componente `<AppNav>` compartido por sidebar y drawer (DRY). (2) **Drawer sobre el primitivo base-ui `Dialog`** que ya envuelve `dialog.tsx` (panel lateral), sin dependencia nueva — respeta boundaries. (3) **Tablas → vista card en `< md`**: el `DataTable` genérico decide tabla vs lista de cards con un hook cliente `useIsMobile` (`matchMedia`, SSR-safe; primer hook en `src/hooks/`), porque el cambio de árbol de render (`<table>` vs cards) no se resuelve solo con CSS; toolbar y paginación se comparten; fallback genérico para todas las rutas + prop opcional `renderCard` para layouts a medida. (4) **Formularios**: `grid-cols-N` → `grid-cols-1 sm:grid-cols-N`; default `max-h/overflow` en `DialogContent`. (5) **Ergonomía táctil sin inflar desktop**: no se cambia el tamaño global de `Button`; se asegura área táctil solo en los controles tocados en móvil. Se entrega en 3 sub-fases (13a fundaciones+shell, 13b tablas-card, 13c formularios).
**Alternativa descartada**: bottom navigation nativa (mejor ergonomía de pulgar pero más trabajo y un segundo árbol de navegación que mantener); sidebar mini-rail colapsable (roba ancho igual en móviles chicos).
**Consecuencias**: primer hook compartido (`src/hooks/`) y primer uso de `matchMedia` para layout (introduce una decisión de render dependiente de cliente en `DataTable`, con `useIsMobile` devolviendo `false` en server para evitar mismatch de hidratación). Transversal, sin server actions ni entidad → **sin doc de módulo** (precedente: sesión "Performance + UI"). No cambia el modelo de datos ni los boundaries.
