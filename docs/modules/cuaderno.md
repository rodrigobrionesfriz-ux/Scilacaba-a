# Módulo: Cuaderno de Campo

**Fase**: 6 · **Estado** (slice 6a): HECHO (código + tests; e2e/manual por el usuario pendiente)
**Ubicación**: capas bajo `src/` (ADR-013). Ruta `src/app/(app)/cuaderno/`.

El Cuaderno de Campo del monolito tiene 8 sub-módulos. Se construye por slices:

- **6a (este)**: Paños, Catálogo de productos, Aplicaciones manuales. **HECHO**.
- **6b/6c (pendiente)**: Órdenes de Aplicación (OA) + distribución, Confirmaciones, Fertirriego (sectores/órdenes OAF/config/aportes), Estimación de cosecha.
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

## Evidencia de verificación

- Estático: `pnpm typecheck && pnpm lint && pnpm test` (83) `&& pnpm build` verdes (2026-06-28).
- Manual e2e: pendiente (usuario).
