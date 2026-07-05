# Diseño — Compra Urgente + Gestión de Equipos (nebulizadoras)

**Fecha**: 2026-07-04 · **Fase**: gap vs monolito `main` (ver `docs/gap-monolito-main.md`, ítems 5 y 6).

## Contexto

El monolito se actualizó en `main` con dos features del Cuaderno de Campo que v2 no tiene:

- **Gestión de Equipos (nebulizadoras)**: catálogo `{nombre, capacidad}` usado en el
  formulario de orden de aplicación para elegir equipo y calcular el nº de estanques.
- **Compra Urgente**: al trabajar una orden de aplicación, detecta los productos cuyo stock
  no cubre lo requerido y los presenta como lista de "comprar".

Ambas viven en el Cuaderno (sin nav de primer nivel en el monolito). Se implementan como un
**único slice** porque comparten la migración de `application_orders` y el formulario de orden.

Referencia monolito (`origin/main:index.html`): Equipos `abrirGestionEquipos`/`ge*`/`ccEquipoSel`
(16283-16350); Compra Urgente `renderCompraUrgente`/`abrirCompraUrgente`/`_stockProductoOrden`
(14096-14163, 16453). `cc*` = Cuaderno de Campo. Los "equipos" son nebulizadoras (no se
relacionan con Mantenciones ni con el catálogo de equipos de Fertirriego).

## Decisiones tomadas

1. **Compra Urgente se calcula EN VIVO** (no snapshot): al abrir la vista, cruza lo requerido
   por cada orden vigente contra el stock ACTUAL. No persiste nada (lectura derivada). Ventaja:
   siempre fresco; si se compra stock, el faltante desaparece. Se aparta a propósito del
   snapshot-al-emitir del monolito.
2. **Equipos = tabla propia** (no blob), siguiendo la arquitectura por capas (skill `new-entity`).
3. **Un slice / un PR / una migración**.
4. **Banner de Compra Urgente en el dashboard: diferido** al trabajo del dashboard (P1); reusará
   la misma query.

## Feature A — Gestión de Equipos (nebulizadoras)

### Modelo de datos
- Nueva tabla `equipos` (`src/db/schema/cuaderno.ts` o `maestros.ts`):
  `{ id bigint PK (epoch-ms), nombre text notNull, capacidad numeric(18,4) notNull, activo boolean default true, creadoAt timestamptz }`. Unicidad lógica por `nombre` (guard en action).
- Columnas nuevas en `application_orders`: `equipo text` (nombre), `equipoCap numeric(18,4)`,
  `nEstanques integer`.
- Migración drizzle (`pnpm db:generate`).

### Capas
- `src/schemas/equipos.schema.ts` — zod: `nombre` min 1, `capacidad` > 0. `z.infer` → tipo.
- `src/types/equipos.types.ts` — `EquipoRow`.
- `src/server/equipos/equipos.queries.ts` — `getEquipos()` (activos, orden por nombre).
- `src/server/equipos/equipos.actions.ts` — `crearEquipo`/`editarEquipo`/`eliminarEquipo`
  (`"use server"`, `requirePermiso("cuaderno.editar")`, guard nombre único, soft delete vía
  `activo`, `revalidatePath`). Auditar con `registrarAuditoria` (paridad con maestros).
- `src/utils/ordenes.utils.ts` — `calcularEstanques(tAgua, capacidad)` puro:
  `capacidad > 0 ? Math.ceil(tAgua / capacidad) : 0`. Testeado.
- `src/schemas/ordenes.schema.ts` — añadir `equipo?`, `equipoCap?` (opcionales) al schema de orden.
- `src/server/ordenes/ordenes.actions.ts` — al crear/editar orden, persistir `equipo`, `equipoCap`
  y `nEstanques` (calculado server-side desde `tAgua` y `equipoCap`; no confía en el cliente).

### UI
- `src/app/(app)/cuaderno/ordenes/(sections)/ordenes.form.tsx`: `<Select>` de nebulizadoras
  (items desde `getEquipos`), al elegir auto-rellena `equipoCap`, y muestra preview en vivo de
  "N° de estanques" (`calcularEstanques(tAgua, equipoCap)`). Botón "Gestionar nebulizadoras" que
  abre un `Dialog`.
- `src/app/(app)/cuaderno/ordenes/(sections)/ordenes.equipos-dialog.tsx` (nuevo, 1 componente):
  CRUD inline de nebulizadoras (lista + alta + editar nombre/capacidad + eliminar), patrón
  `useState`/`useTransition`/zod/`toast` como el resto del proyecto.

## Feature B — Compra Urgente (en vivo)

### Server
- `src/server/compras-urgentes/compras-urgentes.queries.ts` — `getComprasUrgentes()`:
  1. Lee las órdenes de aplicación **vigentes** (`application_orders`). En v2 "vigente" =
     orden existente (no hay anulación de órdenes, a diferencia de movimientos). Nota: si se
     quisiera excluir órdenes ya confirmadas/aplicadas, se decide en implementación; el
     monolito no las excluye (filtra solo por existencia).
  2. Por orden, obtiene lo **requerido por producto** desde el cálculo de la orden (blob
     `productos[]` / totales ya computados por `calcularDistribucion`).
  3. Cruza contra el stock actual (`getStockResumenPorProducto` de `src/server/stock`).
  4. `falta = requerido − disponible`; incluye solo `falta > 0`.
  5. Agrupa por producto → `{ producto, totalFalta, unidad, ordenes:[{ id, numero, fecha,
     requerido, disponible, falta }] }`.
- **Resolución producto→stock**: util puro `resolverProductoStock(nombre, catalogo)` en
  `src/utils/compras-urgentes.utils.ts` que normaliza el nombre (MAYÚSCULAS/trim/colapsa
  espacios, igual que el monolito) y lo matchea contra `products.descripcion`. Sin match →
  "no está en bodega" (disponible 0, todo lo requerido es falta). **Riesgo principal**: el
  match por nombre; se aísla y testea con casos reales.
- `src/types/compras-urgentes.types.ts` — tipos del resultado agrupado.

### UI
- Nueva pestaña en el Cuaderno: `src/app/(app)/cuaderno/compra-urgente/page.tsx` (server, ≤20
  líneas, compone) + `(sections)/compra-urgente.view.tsx` (tabla agrupada por producto con
  detalle por orden). Gate `cuaderno.ver`.
- Añadir la pestaña a `TABS_CUADERNO` (`src/constants/cuaderno.constants.ts`), con resaltado
  activo por ruta (patrón existente).
- **Banner del dashboard**: NO en este slice (dashboard es stub); se añadirá al implementar el
  dashboard reusando `getComprasUrgentes()`.

## Boundaries / arquitectura
- `server/compras-urgentes` puede importar `server/stock` (queries) o consultar `db` directo;
  se reusa `getStockResumenPorProducto`. `app` llama a las queries de `server`, nunca a `db`.
- Utils puros (`calcularEstanques`, `resolverProductoStock`) en `src/utils`, testeados.
- Reglas de estilo: arrow functions, sin `;`, comillas dobles, sin `any`/`as`.

## Testing (verificación end-to-end)
- **Unit (vitest)**: `calcularEstanques` (ceil, capacidad 0, exacto), `resolverProductoStock`
  (match exacto, normalización, sin match), agrupación de `getComprasUrgentes` (lógica pura
  extraída si aplica).
- **Migración**: `pnpm db:generate` + `pnpm db:migrate` en develop (idempotente).
- **e2e manual** (develop desplegado): (a) crear nebulizadora, elegirla en una orden, verificar
  nº de estanques = ceil(tAgua/cap); (b) crear una orden que requiera más de lo disponible en
  stock → verla en `/cuaderno/compra-urgente` agrupada por producto con requerido/disponible/
  falta; comprar stock (movimiento ENT) → el faltante baja/desaparece (prueba del cálculo en vivo).
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` verdes.

## Fuera de alcance
- Banner de Compra Urgente en el dashboard (→ trabajo del dashboard, P1).
- Persistencia/snapshot de compras urgentes.
- Cualquier relación de nebulizadoras con Mantenciones o Fertirriego.
