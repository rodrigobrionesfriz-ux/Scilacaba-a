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
