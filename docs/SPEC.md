# SPEC maestro — SCI v2

Reescritura completa de **SCI · Sistema de Control de Inventario** (hoy un único `index.html` de ~20.365 líneas en vanilla JS) a una aplicación moderna, mantenible y testeable, **preservando el 100% de la funcionalidad** y **migrando los datos reales** desde Firebase a Postgres.

> El plan completo y aprobado vive en el repo del autor en `/.claude-work/plans/crea-una-rama-a-calm-crescent.md`. Este SPEC es el resumen canónico dentro del repo. Si hay conflicto, **manda este documento + DECISIONS.md**.

## Visión

SCI es un sistema de inventario para una empresa agrícola, con un fuerte componente de **cuaderno de campo** (aplicaciones de productos, paños, fertirriego, estimaciones de cosecha) y módulos de **terreno** que se usan en campo, a veces sin señal. El monolito actual funciona pero no es mantenible ni seguro. SCI v2 conserva el comportamiento que los usuarios conocen, pero sobre una arquitectura limpia.

## Stack

- **Next.js (App Router) + TypeScript** — framework de UI y servidor.
- **Server Actions** — mutaciones desde el cliente sin API REST manual.
- **Postgres + Drizzle ORM** — persistencia y migraciones tipadas.
- **better-auth** — autenticación, sesiones, roles y permisos (reemplaza Firebase Auth).
- **Tailwind + shadcn/ui** — UI; **TanStack Table** (tablas), **recharts** (gráficos), **React Hook Form + zod**.
- **Dexie (IndexedDB)** — solo módulos de terreno (offline) + PWA (next-pwa/serwist).
- **SheetJS (XLSX)** — import/export Excel (server-side). **@react-pdf/renderer** — PDFs.
- **Vitest** (unit/integración) + **Playwright** (e2e).
- **Hosting**: Railway (Postgres + app).

## Decisiones globales (detalle en DECISIONS.md)

1. **Reescritura completa**, no incremental. El monolito queda como referencia de funcionalidad.
2. **Offline híbrido**: toda la app es online vía Server Actions, EXCEPTO los 2 módulos de terreno (Conteos, Inventario de huerto) que capturan offline y suben diferido.
3. **better-auth** con role + `permissions[]` en tabla de dominio `users`.
4. **Screaming Architecture modular**: la estructura grita el dominio (`src/modules/<modulo>`), no el framework. Cada módulo es un vertical slice (`domain/ data/ actions/ ui/` + `index.ts`).
5. **Git-flow**: `develop` es la rama de integración; features salen de `develop`; `main` solo para releases.
6. **PPP** (promedio ponderado) vive en una función pura única, compartida por la Server Action y el migrador.

## Arquitectura (resumen)

```
app/                # routing fino: cada page.tsx delega en su módulo
src/modules/<m>/    # vertical slices: domain/ data/ actions/ ui/ index.ts
src/shared/         # kernel transversal: db, auth, actions, excel, pdf, offline, ui, utils
docs/               # este sistema de handoff
```

**Regla de dependencias**: `app → modules (vía index.ts) → shared`. Un módulo nunca importa los internals de otro. Vigilado por lint de boundaries en CI.

## Módulos (~17)

Dashboard · Productos · Bodegas · Proveedores · Clientes · Centros de Costo · Stock · Movimientos (11 tipos ENT/SAL, costeo PPP) · Tomas de inventario · Cuaderno de Campo (aplicaciones, órdenes, paños, fertirriego, estimaciones, catálogo) · Conteos en terreno (offline) · Inventario de huerto (offline) · Mantenciones · Presupuesto · Usuarios · Configuración · Auditoría.

Transversal: import/export Excel, PDFs, gráficos, multi-bodega, permisos granulares (6 roles, ~38 permisos), trazabilidad por lote, audit trail.

## Modelo de datos (resumen)

Ver `docs/migrator.md` para el mapeo completo store→tabla. Puntos clave:

- `movements` + **`movement_lines`** (tabla hija relacional — libro mayor del PPP).
- `stock` con PK compuesta `(codigo_interno, bodega_id)`, cache derivado de las líneas.
- `lots` con unique `(codigo_interno, bodega_id, lote)` e **id determinístico `lot|cod|bod|lote`** (recálculo idempotente — ver ADR-009).
- `counters` para correlativos transaccionales (sin huecos).
- Cuaderno: `panos`, `field_records`, `application_orders` (con `productos[]/distribucion/objetivos` en jsonb).
- Terreno: `conteos` (jsonb `arboles`), `invplantas` (jsonb `plantas`, estados `sano|debil|muerto|replante|falta`).
- Auth: tablas de better-auth + `users` de dominio (role + `permissions[]`).

## Glosario

- **PPP**: Precio/Promedio Ponderado. Costeo: ENT recalcula promedio; SAL no toca PPP; TRASPASO mueve costo de origen a destino.
- **Toma**: conteo físico de inventario que genera ajustes (movimientos `TOMA INVENTARIO ENT/SAL`).
- **Paño**: parcela/cuartel agrícola (variedad, hectáreas, nº plantas).
- **Cuaderno de Campo**: registro de aplicaciones de productos fitosanitarios y de gestión agrícola.
- **Tombstone (lápida)**: marca de eliminación para que la sincronización no reinyecte registros borrados.
- **`_mod`**: timestamp de modificación en stores acumulativos (merge multi-dispositivo).

## Fuente de verdad de la funcionalidad original

El `index.html` original (en la rama de referencia) es la especificación viva del comportamiento. Líneas clave en `docs/migrator.md` y en cada `docs/modules/<x>.md`.
