# Módulo: Cuaderno de Campo

**Fase**: 6 · **Estado** (slices 6a + 6b): HECHO (código + tests; e2e/manual por el usuario pendiente)
**Ubicación**: capas bajo `src/` (ADR-013). Ruta `src/app/(app)/cuaderno/`.

El Cuaderno de Campo del monolito tiene 8 sub-módulos. Se construye por slices:

- **6a**: Paños, Catálogo de productos, Aplicaciones manuales. **HECHO**.
- **6b**: Órdenes de Aplicación (OA) + distribución por paño + Confirmaciones. **HECHO**.
- **6c (pendiente)**: Fertirriego (sectores/órdenes OAF/config/aportes).
- **Estimación de cosecha → Fase 7** (depende de `conteos`/`invplantas`, datos de terreno offline; su tabla vive en `terreno.ts`).
- Reportes Excel → Fase 10.

## Alcance 6a (qué replica del original)

CRUD de las tres entidades base. Referencia monolito (`index.html`, rama `main`):

- **Paños / cuarteles** — setup wizard paso 1 (`1180-1205`), tab Paños (`1508-1522`), `addPanoRow` (~13100), `COLORS` (`12707`).
- **Catálogo** (`field_products`) — tab Productos (`1523-1581`), `S.productos`.
- **Aplicaciones** (`field_records`) — tab Nueva Aplicación (`1292-1357`), `guardarRegistro` (~15380). Listas verbatim: tipos (`1297`), unidades (`1308`), métodos (`1311`).

NO cubre (diferido): órdenes/confirmaciones/fertirriego/estimación, edición de los blobs jsonb `prodPct` (paños) y `aportes` (catálogo), descuento de stock (en el monolito las rebajas son manuales).

## Modelo de datos (tablas Drizzle — ya migradas en Fase 1)

`src/db/schema/cuaderno.ts`:
- **`panos`** — PK `id` (bigint epoch-ms). 6a edita: nombre (notNull), variedad, anio, hectareas/has_riego/densidad (numeric), plantas (int), color. Preservados verbatim (no se editan): deh, dsh, porta_injerto, pano_padre, tipo, prod_pct (jsonb).
- **`field_products`** — PK `nombre` (text). 6a edita: tipo, unidad, dosis (text), ingrediente_activo, objetivo. Preservado: aportes (jsonb).
- **`field_records`** — PK `id` (bigint epoch-ms), FK `pano_id → panos.id`. Campos: fecha (date), tipo, producto, dosis (text), unidad, metodo, operador, obs, lote.

Sin migración nueva (las tablas existen desde Fase 1). IDs nuevos = `Date.now()` con +1 ante colisión (convención epoch-ms del origen).

## Server (`src/server/`)

| Action | Entrada (zod) | Permiso | Efectos | Revalida |
|--------|---------------|---------|---------|----------|
| `panos.crearPano` / `editarPano` | `panoSchema` | `cuaderno.panos` | insert/update paño | `/cuaderno/panos` |
| `panos.eliminarPano` | `id` | `cuaderno.panos` | delete (guard: rechaza si hay `field_records` o `application_orders` que lo referencien) | `/cuaderno/panos` |
| `productos-cuaderno.crear/editar/eliminar` | `productoCuadernoSchema` | `cuaderno.editar` | CRUD `field_products` (PK nombre; dup-check al crear; delete duro) | `/cuaderno/productos` |
| `aplicaciones.crear/editar/eliminar` | `aplicacionSchema` | `cuaderno.editar` | CRUD `field_records` | `/cuaderno/aplicaciones` |

Queries: `getPanos`, `getProductosCuaderno`, `getAplicaciones` (join a `panos.nombre`).

## Constantes y schemas

- `src/constants/cuaderno.constants.ts` — `TIPOS_PRODUCTO` (15), `UNIDADES_DOSIS` (9), `METODOS_APLICACION` (6), `COLORES_PANO` (10), `TABS_CUADERNO`, títulos. Verbatim del monolito.
- `src/schemas/{panos,productos-cuaderno,aplicaciones}.schema.ts` (zod). Tests en `src/schemas/cuaderno.schema.test.ts`.
- Tipos `src/types/{panos,productos-cuaderno,aplicaciones}.types.ts` (filas del listado, laxas).

## UI (`src/app/(app)/cuaderno/`)

- `layout.tsx` — `requirePermiso("cuaderno.ver")` (guard único de la sección) + título + `CuadernoTabs`.
- `page.tsx` — redirect a `/cuaderno/panos`.
- `(sections)/cuaderno.tabs.tsx` — sub-nav Paños | Catálogo | Aplicaciones (`usePathname`).
- `panos/`, `productos/`, `aplicaciones/` — cada una: `page.tsx` + `(sections)/<e>.{view,table,columns,form,delete}.tsx`. Reusa `DataTable` + `DataTableToolbar` (con `mostrarEstado={false}`, sin columna `activo`) + form-en-modal (useState/useTransition/zod/toast).

Infra compartida tocada: `DataTableToolbar` gana prop `mostrarEstado?` (default true). Sidebar: ítem `cuaderno` activado (`disponible:true`); el resaltado activo ahora cubre sub-rutas (`startsWith`).

## Reglas de negocio (lo no obvio)

- Eliminar un paño está **bloqueado** si tiene aplicaciones o aparece en órdenes de aplicación migradas (`pano_ids` text[]).
- Numéricos opcionales del paño: el form envía `"" → null`; el schema coacciona string→number (≥0).
- El catálogo no descuenta stock (fiel al monolito).

## Checklist de verificación end-to-end

- [ ] Login admin/agronomo → ítem "Cuaderno de Campo" habilitado; `/cuaderno` redirige a `/cuaderno/panos`; las 3 pestañas navegan.
- [ ] Paños: ver migrados; crear/editar; eliminar con aplicación asociada → rechazado; eliminar sin referencias → ok.
- [ ] Catálogo: ver migrados; crear/editar/eliminar.
- [ ] Aplicaciones: crear con paño + producto (datalist) + tipo/unidad/método; ver con nombre de paño; editar; eliminar.
- [ ] Validación zod muestra error en datos inválidos.
- [ ] Rol solo-lectura (`gerente`, `cuaderno.ver`): ve tablas sin botones de crear/editar/eliminar.
- [x] typecheck/lint/83 tests/build verdes.

---

# Slice 6b — Órdenes de aplicación (OA) + Confirmaciones

CRUD de **Órdenes de Aplicación** con cálculo de distribución por paño, y
**Confirmaciones** que recalculan las cantidades reales según el agua aplicada.
Sin migración nueva (`application_orders`/`application_confirmations` existen
desde Fase 1). El cuaderno **no descuenta stock** (fiel al monolito).

## Lógica replicada del monolito (`index.html`, rama `main`)

- **Distribución** (`calcDist` L15561, `_calcProdQty` L15765): `mojT = moj × vha`;
  por paño `agua = mojT × has`; cantidad de producto `/100L` = `(dosis/100) × agua`,
  `/ha` = `dosis × has`. Totales `tHas/tAgua/tProd` por suma. `has` = `hectareas`
  (o `has_riego` si tipo Fertirriego, vía `resolverHas`).
- **Confirmación** (`cfRecalcProductos` L16661): `factor = aguaReal/aguaPlan`
  (1 si `aguaPlan=0`); `qtyAplicada = producto.tProd × factor`.
- **Estado** (`cfEstadoOrden` L16356): Pendiente (sin confirmaciones o sin paños) ·
  Parcial · Completa (todos los `panoIds` cubiertos por alguna confirmación).
- **Correlativo** `OA-00001` (counter `OA`, padding a 5). El migrador preserva el
  `numero` verbatim → las OA nuevas mantienen el formato.

## Server (`src/server/`)

| Action | Permiso | Efectos |
|--------|---------|---------|
| `ordenes.crearOrden`/`editarOrden` | `cuaderno.editar` | calcula distribución+totales server-side (`calcularDistribucion`), puebla campos legacy del 1er producto, correlativo `OA`; editar marca `editada`/`editadaFecha`/`editadaPor` |
| `ordenes.eliminarOrden` | `cuaderno.editar` | delete (guard: rechaza si tiene confirmaciones) |
| `confirmaciones.crearConfirmacion` | `cuaderno.confirmar` | recalcula `productosReales` (`recalcularProductosReales` vs `orden.tAgua`) |
| `confirmaciones.eliminarConfirmacion` | `cuaderno.confirmar` | delete |

Queries: `getOrdenes` (estado de cobertura derivado del conteo de confirmaciones
por `ordenId`), `getOrden`, `getConfirmaciones`. Reusa `getPanos` y
`getProductosCuaderno` de 6a. Blobs jsonb narroweados sin `as` (helpers
`aProductosOrden`/`aDistribucion`/`aProductosReales` en `ordenes.utils.ts`).

## Cálculo, tipos, schemas, constantes

- **Pura** `src/utils/ordenes.utils.ts` (única fuente de verdad, compartida por
  form y action): `unidadBase`, `calcProdQty`, `resolverHas`, `calcularDistribucion`,
  `recalcularProductosReales`, `estadoOrden` + narrowing de blobs. Tests en
  `ordenes.utils.test.ts`.
- `src/types/ordenes.types.ts` (OrdenRow, ProductoOrden, DistribucionPano,
  ProductoReal, ConfirmacionRow).
- `src/schemas/{ordenes,confirmaciones}.schema.ts` (zod). Tests en
  `cuaderno.schema.test.ts`.
- `src/constants/cuaderno.constants.ts`: `TIPOS_APP` (3), `ESTADOS_FENOLOGICOS`
  (16), `OBJETIVOS_APP` (catálogo agrupado), `UNIDADES_ORDEN` (9), `PREFIJO_OA`,
  `ESTADOS_ORDEN`, `TURNOS_CONFIRMACION`. Verbatim del monolito.

## UI (`src/app/(app)/cuaderno/`)

- `ordenes/` — tríada page/view/table/columns + `ordenes.form.tsx` (header +
  mojamiento + sub-lista dinámica de productos + multi-select de paños + **preview
  de distribución en vivo** reusando `calcularDistribucion`), `ordenes.detalle.tsx`
  (read-only), `ordenes.confirmar.tsx` (diálogo de confirmación con preview de
  cantidades reales), `ordenes.delete.tsx`.
- `confirmaciones/` — page/view/table/columns + `confirmaciones.delete.tsx`
  (listado; se confirma desde la fila de la orden, como en el monolito).
- 2 pestañas nuevas en `TABS_CUADERNO` (Órdenes, Confirmaciones).

## Reglas de negocio (lo no obvio)

- La distribución es **autoritativa en el server** (la action recalcula con la
  misma util que el preview del form; el cliente no envía la distribución).
- Confirmar no edita stock; solo recalcula cantidades reales por proporción de agua.
- `qtyAplicada` se guarda en la unidad base (sin el auto-escalado mL→L del
  monolito); el formato de presentación queda en la UI.

## Checklist de verificación end-to-end (6b)

- [ ] Login agrónomo/admin → pestañas **Órdenes** y **Confirmaciones**; las OA
  migradas se listan con estado correcto.
- [ ] Crear OA: 2+ productos + 2 paños + moj/vha → preview cuadra con la fórmula;
  guardar → `OA-000NN`, estado Pendiente.
- [ ] Confirmar cubriendo 1 de 2 paños → **Parcial**; cubrir el resto → **Completa**;
  `productosReales` = planificado × (aguaReal/aguaPlan).
- [ ] Editar OA → marca `editada`; eliminar OA con confirmaciones → rechazado.
- [ ] Rol `gerente` (solo `cuaderno.ver`): tablas sin botones de crear/confirmar.
- [ ] Validación zod: OA sin productos o sin paños → error.
- [x] typecheck/lint/106 tests/build verdes.

## Evidencia de verificación

- Estático (6a): `pnpm typecheck && pnpm lint && pnpm test` (83) `&& pnpm build` verdes (2026-06-28).
- Estático (6b): `pnpm typecheck && pnpm lint && pnpm test` (106) `&& pnpm build` verdes (2026-06-28).
- Manual e2e: pendiente (usuario).
