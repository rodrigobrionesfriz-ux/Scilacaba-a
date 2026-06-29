# Módulo: Cuaderno de Campo

**Fase**: 6 · **Estado** (slices 6a + 6b + 6c): HECHO (código + tests; e2e/manual por el usuario pendiente)
**Ubicación**: capas bajo `src/` (ADR-013). Ruta `src/app/(app)/cuaderno/`.

El Cuaderno de Campo del monolito tiene 8 sub-módulos. Se construye por slices:

- **6a**: Paños, Catálogo de productos, Aplicaciones manuales. **HECHO**.
- **6b**: Órdenes de Aplicación (OA) + distribución por paño + Confirmaciones. **HECHO**.
- **6c**: Fertirriego (sectores/órdenes OAF/config/aportes). **HECHO**.
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
- Estático (6c): `pnpm typecheck && pnpm lint && pnpm test` (131) `&& pnpm build` verdes (2026-06-29).
- Manual e2e: pendiente (usuario).

---

# Slice 6c — Fertirriego (sectores · OAF · config · aportes)

Módulo Fertirriego completo (las 5 sub-pestañas del monolito) bajo
`/cuaderno/fertirriego`. **Sin migración nueva**: las tablas `fertirriego_sectores`/
`fertirriego_ordenes`/`fertirriego_config` y el counter `OAF` ya existen desde Fase 1;
los aportes reusan el blob `field_products.aportes`. El cuaderno **no descuenta stock**.

## Diferencias con las OA de 6b (no asumir simetría)

- **Sin distribución por sector.** Las líneas de una OAF aplican a la orden completa;
  lo que se calcula es el **aporte nutricional total** (kg de cada nutriente) sobre la
  há total de los sectores seleccionados (no hay reparto agua/producto por sector).
- **Confirmación = toggle en la propia orden** (`confirmada`/`confirmadaFecha` en
  `fertirriego_ordenes`), reversible, sin entidad aparte ni recálculo. No hay pestaña
  "Confirmaciones" — confirmar/reabrir es una acción sobre la fila de la OAF.
- **PK de texto (uid):** sectores y OAF usan `crypto.randomUUID()` (no epoch-ms).

## Lógica replicada del monolito (`index.html`, rama `main`)

- **Aporte nutricional** (`dosisAKg` + cálculo en `frVerOrden`, L14224-14240): por línea
  `kgProd = dosisAKg(dosis,unidad) × haTotal`; por nutriente `total += kgProd × (%/100)`.
  `dosisAKg`: GRS./G y C.C/mL → `/1000`; kg y L → ×1 (densidad ~1); resto passthrough.
- **Autocompletado de aportes** (`frBuscarAporteBase`/`_frNorm`, L13685-13704): match por
  patrones contra una base de 43 fertilizantes; gana la coincidencia más específica.
- **`FR_NUTRIENTES`** = N, P, K, Mg, S, Ca, B, Zn (L13631). **Defaults de cfg** (formas,
  horarios, unidades, estados, condiciones, tiposDoc, rangos) verbatim de
  `_ensureFertirriego` (L12486). **`TIPOS_FR`** (fertilizante suelo/edáfico/enmienda,
  L14114) filtra el catálogo de la pestaña Productos y de las líneas de OAF.
- **Correlativo** `OAF-00001` (counter `OAF`, padding a 5).

## Server (`src/server/`)

| Action | Permiso | Efectos |
|--------|---------|---------|
| `sectores.crearSector`/`editarSector` | `cuaderno.editar` | CRUD `fertirriego_sectores` (id uid) |
| `sectores.eliminarSector` | `cuaderno.editar` | delete (guard: rechaza si el sector está en alguna OAF — `arrayContains`) |
| `oaf.crearOaf`/`editarOaf` | `cuaderno.editar` | CRUD `fertirriego_ordenes`; correlativo `OAF`; `lineas` al blob; `updatedAt` |
| `oaf.eliminarOaf` | `cuaderno.editar` | delete |
| `oaf.confirmarOaf`/`desconfirmarOaf` | `cuaderno.confirmar` | toggle `confirmada`+`confirmadaFecha` |
| `productos-cuaderno.guardarAportes` | `cuaderno.editar` | update `aportes`/`unidad`/`dosis` de `field_products` |
| `fertirriego-config.guardarConfigFert` | `cuaderno.editar` | upsert del blob `cfg` (singleton `id="main"`) |

Queries: `getSectores`, `getOrdenesFert` (nombres de sectores + há total derivados),
`getOrdenFert`, `getProductosFertirriego` (filtra por `TIPOS_FR`, incluye `aportes`),
`getConfigFert` (fusiona el blob con los defaults). Blobs jsonb narroweados sin `as`
(`aLineas`/`aAportes`/`aConfigFert` en `fertirriego.utils.ts`).

## Cálculo, tipos, schemas, constantes

- **Pura** `src/utils/fertirriego.utils.ts` (única fuente de verdad, form + vistas):
  `dosisAKg`, `haTotalSectores`, `calcularAportes`, `frNorm`, `buscarAporteBase` +
  narrowing de blobs. Tests en `fertirriego.utils.test.ts`.
- `src/types/fertirriego.types.ts` (SectorRow, LineaOaf, OafRow, AporteTotal,
  ProductoFertRow, ConfigFert, Aportes, …).
- `src/schemas/{sectores,oaf,fertirriego-config,aportes}.schema.ts` (zod). El record de
  aportes usa `z.partialRecord(z.enum(FR_NUTRIENTES), …)`. Tests en
  `fertirriego.schema.test.ts`.
- `src/constants/fertirriego.constants.ts`: `PREFIJO_OAF`/`OAF_PADDING`, `FR_NUTRIENTES`,
  `TIPOS_FR`, defaults de cfg, `FERTILIZANTES_BASE` (43), `TABS_FERTIRRIEGO`, títulos.
  Pestaña "Fertirriego" añadida a `TABS_CUADERNO` (resaltado activo por `startsWith`).

## UI (`src/app/(app)/cuaderno/fertirriego/`)

Sub-sección anidada **bajo** el `layout.tsx` de cuaderno (guard `cuaderno.ver` ya
aplicado). `layout.tsx` + `(sections)/fertirriego.subtabs.tsx` (sub-nav Órdenes ·
Sectores · Productos y aportes · Parámetros); `page.tsx` → redirect a `ordenes`.

- `ordenes/` — page + `oaf.{view,table,columns,form,detalle,confirmar,delete}.tsx`. El
  form (multi-select de sectores + sub-lista de líneas + selects desde la cfg) con
  **preview en vivo del aporte** reusando `calcularAportes`. `detalle` muestra la grilla
  de aportes totales. `confirmar` es un botón toggle (no diálogo).
- `sectores/` — page + `sectores.{view,table,columns,form,delete}.tsx` (maestro simple).
- `productos/` — page + `aportes.{view,table,columns,form}.tsx`: edición de la
  composición por nutriente + botón "Autocompletar desde base".
- `parametros/` — page + `parametros.{view,form,lista}.tsx`: identificación + listas
  editables (chips, `ListaEditable` reutilizable) + rangos + predios.

## Reglas de negocio (lo no obvio)

- OAF: validar ≥1 sector y ≥1 línea (como el monolito).
- Borrar sector bloqueado si está en alguna OAF. Borrar OAF: sin guard (no hay entidad
  de confirmación); confirmar/reabrir es reversible.
- El aporte nutricional es **autoritativo en la vista/util** (el form solo previsualiza);
  `dosisAKg` asume densidad ~1 (C.C/mL ≈ g; L ≈ kg) — verbatim del monolito, no "corregir".

## Checklist de verificación end-to-end (6c)

- [ ] Login agrónomo/admin → pestaña **Fertirriego**; sub-pestañas navegan; sectores/OAF
  migrados se listan.
- [ ] Sectores: crear/editar/eliminar; borrar sector usado en una OAF → rechazado.
- [ ] Parámetros: añadir/quitar una forma/horario/unidad/estado → persiste y aparece en el
  form de OAF.
- [ ] Productos y Aportes: editar % de N-P-K; "Autocompletar" rellena desde la base; guardar.
- [ ] OAF: crear con 2 sectores + 2 líneas → preview de aporte cuadra con `dosisAKg×ha×%`;
  guardar → `OAF-000NN`, estado Pendiente; confirmar → Confirmada + fecha; reabrir; editar;
  eliminar.
- [ ] Rol `gerente` (solo `cuaderno.ver`): tablas sin botones de crear/editar/confirmar.
- [ ] Validación zod: OAF sin sectores o sin líneas → error.
- [x] typecheck/lint/131 tests/build verdes.
