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
**Fecha**: 2026-06-25 · **Estado**: aceptada
**Contexto**: Se descartó organizar por capas técnicas (`lib/db`, `lib/domain`...) porque "grita el framework", no el negocio.
**Decisión**: Estructura por dominio: `src/modules/<modulo>/{domain,data,actions,ui,index.ts}`. `app/` es routing fino; `src/shared/` es el kernel transversal. Layering interno **pragmático** (domain/data/actions/ui), no hexagonal estricto.
**Consecuencias**: Regla de dependencias `app → modules (vía index.ts) → shared`; un módulo no importa internals de otro. Vigilado por lint de boundaries.

## ADR-007 — Git-flow con rama `develop`
**Fecha**: 2026-06-25 · **Estado**: aceptada
**Decisión**: `develop` es la rama de integración (creada desde `origin/main`). Cada fase sale de `develop` con `feat/fase-<n>-<modulo>` y vuelve por PR a `develop`. `main` solo para releases a producción.
**Consecuencias**: `main` siempre desplegable. Commits convencionales `feat(modulo): ...`.

## ADR-008 — PPP en función pura única compartida
**Fecha**: 2026-06-25 · **Estado**: aceptada
**Contexto**: El costeo PPP es el corazón del sistema y la fuente más probable de regresiones.
**Decisión**: La lógica de PPP vive en `src/modules/movimientos/domain/ppp.ts` (pura, sin I/O) y la usan tanto la Server Action `crearMovimiento` como el migrador. Cobertura de tests alta y obligatoria.
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
