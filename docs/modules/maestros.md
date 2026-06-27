# Módulo: Maestros (CRUD)

**Fase**: 3 · **Estado**: HECHO (código + tests; verificación visual por el usuario)
**Ubicación**: capas bajo `src/` (ADR-013), una entidad por slice.

## Alcance (qué replica del original)

CRUD de los 5 maestros del monolito:

- **Productos** (`products`) — `index.html:4782-5197`
- **Bodegas** (`warehouses`) — `index.html:5507-5560`
- **Proveedores** (`providers`) — `index.html:5609-5755`
- **Clientes** (`customers`) — `index.html:5799-5946`
- **Centros de Costo** (`cost_centers`) — `index.html:5994-6137`

Cada maestro: listar (tabla con buscador + filtro por estado + orden), crear y editar (modal), y baja (hard delete en Productos, soft delete vía `activo` en el resto). Permisos por entidad (`<e>.ver` / `<e>.crear`; `productos.eliminar`).

**NO cubre (diferido):**
- Columnas de **stock/valor** en las tablas → Fase 4 (dependen de PPP/movimientos).
- **CRUD de sub-catálogos** `product_types` y `groups` → Fase 11 (Configuración). En Fase 3 se **leen** para los selects del form de Productos (`src/server/catalogos/catalogos.queries.ts`).
- **Import/Export Excel** (proveedores/clientes/centros en el monolito) → Fase 10.

## Modelo de datos (tablas Drizzle)

Tablas existentes en `src/db/schema/maestros.ts` (esta fase NO modifica el schema de DB): `products` (PK `codigo_interno`), `warehouses` (PK `id`), `providers`/`customers` (PK `codigo` = RUT sin DV), `cost_centers` (PK `codigo`). Correlativo de Productos en `counters` (`src/db/schema/sistema.ts`), clave `PRODUCTO`.

## Server Actions (`src/server/<e>/<e>.actions.ts`)

| Action | Entrada (zod) | Permiso | Efectos | Revalida |
|--------|---------------|---------|---------|----------|
| `crearProducto` | `productoSchema` | `productos.crear` | genera código (`counters.PRODUCTO` atómico → `P000123`), valida EAN único, inserta | `/productos` |
| `editarProducto` | `productoSchema` | `productos.crear` | guard `manejaAtributos` si hay `movement_lines`; EAN único; update + `modificadoAt` | `/productos` |
| `eliminarProducto` | — | `productos.eliminar` | **hard delete** solo si no hay `movement_lines` | `/productos` |
| `crearBodega`/`editarBodega` | `bodegaSchema` | `bodegas.crear` | id único en alta; soft delete vía `activo` en edición | `/bodegas` |
| `crearProveedor`/`editarProveedor` | `proveedorSchema` | `proveedores.crear` | DV del RUT validado (`rutValido`); código único; soft delete | `/proveedores` |
| `crearCliente`/`editarCliente` | `clienteSchema` | `clientes.crear` | igual a proveedores | `/clientes` |
| `crearCentroCosto`/`editarCentroCosto` | `centroCostoSchema` | `centrosCosto.crear` | código normalizado (uppercase, espacios→`-`); soft delete | `/centros-costo` |

Todas validan el input con zod y devuelven `ActionResult` (`src/types/action.types.ts`).

## Lógica de dominio / reuso

- `requirePermiso(perm)` / `can(user, perm)` (`src/server/auth`, `src/utils/permisos.utils.ts`) — guard de queries/actions y gating del botón Nuevo/Editar.
- `rutValido` / `rutBody` (`src/utils/rut.utils.ts`, reusado por el migrador) — validación de RUT.
- `formatCodigoProducto(valor)` (`src/utils/productos.utils.ts`) — formato `P` + padding 6.
- Proveedores y Clientes comparten **schema** (`entidad-comercial.schema.ts`), **campos de form** (`components/entidad-comercial-fields.tsx`) y **columnas** (`components/entidad-comercial-columns.tsx`).

## UI (`src/app/(app)/<ruta>/(sections)/`)

Por entidad: `<e>.view.tsx` (server: carga datos + gating), `<e>.columns.tsx`, `<e>.table.tsx`, `<e>.form.tsx` (modal crear/editar), y `productos.delete.tsx` (AlertDialog, solo Productos). Infra compartida en `src/components/ui/`: `data-table.tsx` (TanStack), `data-table-toolbar.tsx` (buscador + filtro estado + slot Nuevo), `data-table-sortable-header.tsx`.

## Reglas de negocio (lo no obvio)

- **PK readonly tras crear** en todos (código/id no se edita).
- **Productos**: código autogenerado (correlativo `counters.PRODUCTO`); no cambiar `manejaAtributos` con movimientos; hard delete bloqueado con movimientos.
- **Proveedores/Clientes**: `codigo` = RUT sin DV (6–9 dígitos); el campo `rut` (con DV) valida módulo 11 si se ingresa.
- **Centros de Costo**: `codigo` con `[A-Z0-9_.-]`; `area` con datalist de áreas existentes.
- **Soft delete** (bodegas/proveedores/clientes/centros) = `activo=false` desde el form de edición (no hay permiso `eliminar`).

## Checklist de verificación end-to-end

- [ ] Cada lista carga los datos migrados; buscador, filtro por estado y orden funcionan.
- [ ] Crear con datos válidos → persiste y aparece. Producto autogenera correlativo.
- [ ] Editar → persiste, `modificadoAt` se actualiza, PK readonly.
- [ ] Eliminar Producto (hard) / desactivar resto (soft).
- [ ] Inválidos (RUT con DV erróneo, requeridos vacíos, EAN duplicado, código CC con espacios) → toast de error.
- [ ] Sin `<e>.crear` no aparece Nuevo/Editar; sin `<e>.ver` → redirect a `/dashboard`.
- [ ] Tests unit verdes (`rut.utils`, `formatCodigoProducto`, schemas de maestros).

## Evidencia de verificación

- Estático: `pnpm typecheck` · `lint` · `test` (49) · `build` verdes.
- Visual/CRUD: validado por el usuario en `pnpm dev` contra la DB `develop`.
