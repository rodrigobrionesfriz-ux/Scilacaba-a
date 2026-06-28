# Módulo: Tomas de inventario

**Fase**: 5 · **Estado**: HECHO (código + tests; verificación e2e por el usuario pendiente)
**Ubicación**: capas bajo `src/` (ADR-013): `src/server/tomas/`, `src/app/(app)/tomas/`, `src/{types,schemas,constants}/tomas.*`, `src/utils/tomas.utils.ts`.

## Alcance (qué replica del original)

Conteo físico de existencias por bodega que genera ajustes de inventario. Flujo completo del monolito:

- **Iniciar** una toma: bodega + filtros opcionales grupo/tipo + alcance (`conStock` | `todos`). Se arma un snapshot teórico de stock/lotes (PPP congelado).
- **Capturar** el físico por línea (guardar parcial).
- **Cerrar** para autorización (lo no contado se asume en físico 0).
- **Autorizar y aplicar**: genera 1 movimiento `TOMA INVENTARIO ENT` (TIE) consolidado por sobrantes y 1 `TOMA INVENTARIO SAL` (TIS) por faltantes; recalcula stock (PPP).
- **Devolver** al operador (reeditable) o **Rechazar** (archivada sin efecto).

Referencia en el monolito: `index.html` ~líneas 6140–6760, funciones `iniciarToma`, `continuarToma`, `setTomaFisico`, `cerrarTomaParaAutorizacion`, `autorizarYAplicarToma`, `_aplicarAjustesToma`, `devolverToma`, `rechazarToma`.

**No cubre (diferido):**
- Export Excel de la toma e **informe de ajustes PDF** → Fase 10.
- Agregar líneas manuales durante la captura (productos no listados). El alcance `todos` ya lista todos los productos activos; queda como mejora futura.
- Reingreso de contraseña al autorizar (se decidió gatear solo por permiso `tomas.autorizar`).

## Modelo de datos (tablas Drizzle — `src/db/schema/tomas.ts`)

- `inventory_counts` (PK `id` text). Cabecera: `numero`, `bodegaId` (FK warehouses), `estado`, `alcance`, `filtroGrupo/Tipo`, `observaciones`, `usuario` (= id del operador), `autorizadoPor`, `devolucionMotivo`, `rechazoMotivo`, `movimientosGenerados` (text[] de números TIE/TIS), y timestamps/autores: `creadoAt`, `cerradoAt/Por`, `autorizadoAt`, `aplicadoAt`, `devolucionAt/Por`, `rechazoAt/Por`. Columnas de trazabilidad agregadas en `drizzle/0004_eager_prima.sql` (ADD COLUMN nullable).
- `inventory_count_lines` (PK serial, FK `countId` → cascade). `codigoInterno` (FK products), denormalizados `descripcion/unidadMedida/manejaAtributos/loteId/lote/fechaVenc`, `teorico` + `costoTeorico` (snapshot congelado), `fisico` (nullable), `fisicoIngresado`, `asumidoCero`.

### Estados (verbatim del monolito — la data migrada los usa así)

`EN_PROCESO` → `PENDIENTE_AUTORIZACION` → (`AUTORIZADA`, transitorio) → `APLICADA`; ramas `DEVUELTA` (reeditable) y `RECHAZADA` (archivada). La autorización web va directo a `APLICADA` (setea `autorizadoAt` + `aplicadoAt`).

## Server (`src/server/tomas/`)

**Queries (`tomas.queries.ts`)**
- `getTomas()` — listado con agregados (total / conteadas / con diferencia) en 1 query, sin N+1.
- `getToma(id)` — cabecera + líneas (ordenadas por descripción).
- `getStockParaToma(bodegaId, {grupo, tipo, alcance})` — arma las líneas teóricas leyendo `products` + `stock` + `lots`; la selección vive en el util puro `construirLineasTeoricas`.
- `getTomaEnCursoDeUsuario(usuario)` — guard de "una toma abierta por operador".

**Actions (`tomas.actions.ts`)**

| Action | Entrada (zod) | Permiso | Efectos | Revalida |
|--------|---------------|---------|---------|----------|
| `iniciarToma` | `iniciarTomaSchema` | `tomas.crear` | correlativo `TOMA` + inserta cabecera EN_PROCESO + líneas teóricas | `/tomas`, `/tomas/[id]` |
| `guardarConteo` | `capturarTomaSchema` | `tomas.crear` (dueño, editable) | persiste físicos | `/tomas/[id]` |
| `cerrarToma` | `capturarTomaSchema` | `tomas.crear` (dueño, editable) | físicos + asume 0 los pendientes; estado PENDIENTE_AUTORIZACION | `/tomas/[id]` |
| `autorizarToma` | `countId` | `tomas.autorizar` | genera TIE/TIS + recalcula stock + estado APLICADA | `/tomas`, `/stock`, `/movimientos`, `/productos`, `/bodegas` |
| `devolverToma` | `motivoTomaSchema` | `tomas.autorizar` | estado DEVUELTA + limpia asumidoCero | `/tomas/[id]` |
| `rechazarToma` | `motivoTomaSchema` | `tomas.autorizar` | estado RECHAZADA | `/tomas/[id]` |

**Reuso clave (DRY):** la inserción de movimiento (correlativo atómico + `movements` + `movement_lines`) se extrajo a `src/server/inventario/inventario.core.ts` → `insertarMovimiento(tx, datos)`, consumida por `crearMovimiento` (Fase 4) y por `autorizarToma`. La autorización la llama hasta 2× (TIE/TIS) y luego un único `recalcularStockScoped` sobre todos los códigos afectados, en una sola transacción.

## Lógica de dominio (`src/utils/tomas.utils.ts`, puro + tests)

- `calcularAjustes(lineas)` → `{ sobrantes, faltantes }`: diferencias `físico vs teórico` (solo `fisicoIngresado`), cantidad positiva, costo = `costoTeorico` congelado.
- `construirLineasTeoricas(...)`: `conStock` omite sin existencias; `manejaAtributos` → una línea por lote con saldo; ordena por descripción.
- `aEstadoToma` / `aAlcance`: narrowing de los text crudos a la unión literal (sin `as`).
- Tests en `src/utils/tomas.utils.test.ts` (11 casos).

## UI (`src/app/(app)/tomas/`)

- `page.tsx` (lista, `requirePermiso("tomas.ver")`) → `tomas.view` → `tomas.table` (+ `tomas.columns`, filtro por estado) + `tomas.iniciar` (modal de inicio).
- `[id]/page.tsx` → `tomas.detalle` (server) decide el modo: **captura** (`tomas.captura`, dueño + editable), **autorización** (`tomas.autorizar` + `tomas.motivo-dialog` para devolver/rechazar), o **lectura** (`tomas.lineas-readonly`).

## Reglas de negocio (lo no obvio)

- **PPP congelado**: el costo del ajuste usa `costoTeorico` capturado al iniciar, no el PPP del momento de aplicar.
- **Asumido cero**: al cerrar, las líneas sin contar pasan a físico 0 con `asumidoCero=true`. Devolver limpia esa marca para recontar.
- **Una toma por operador**: no se puede iniciar otra mientras haya una `EN_PROCESO`/`DEVUELTA` propia.
- **Stock negativo permitido** (paridad Fase 4): el motor PPP hace floor a 0 en salidas; no se bloquea.

## Checklist de verificación end-to-end

- [ ] Operador inicia toma (alcance conStock) → lista de líneas con teórico desde stock/lotes.
- [ ] Captura físicos con diferencias → guardar conteo persiste.
- [ ] Cerrar → estado PENDIENTE_AUTORIZACION; pendientes quedan asumidas en 0.
- [ ] Admin autoriza → se crean TIE/TIS (tagueados `tomaId`/`tomaNumero`) en `/movimientos`; `/stock` refleja el ajuste; estado APLICADA con `movimientosGenerados`.
- [ ] Devolver → vuelve a editable y limpia asumidoCero; Rechazar → archivada sin movimientos.
- [ ] Permiso: sin `tomas.autorizar` no se ven las acciones de autorización.
- [ ] La data migrada (estados `PENDIENTE_AUTORIZACION`/`RECHAZADA`) se lista y se ve bien.
- [x] Tests unit (utils) y typecheck/lint/build verdes.

## Evidencia de verificación

- `pnpm typecheck && pnpm lint` verdes; `pnpm test` 74 tests verdes (11 de tomas); `pnpm build` OK (rutas `/tomas` y `/tomas/[id]`). Migración `0004` aplicada en develop.
