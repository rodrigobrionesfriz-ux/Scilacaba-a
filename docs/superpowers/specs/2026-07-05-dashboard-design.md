# Diseño — Dashboard real (réplica fiel del monolito `main`)

**Fecha**: 2026-07-05 · **Fase**: gap vs monolito `main` (ver `docs/gap-monolito-main.md`, ítem 1).

## Contexto

El dashboard de v2 (`src/server/dashboard/dashboard.queries.ts`) es un **stub de Fase 0**:
`getDashboardStats()` devuelve `{ totalProductos: 0, totalBodegas: 0, valorInventario: 0 }`
hardcodeado. La vista (`dashboard.view.tsx`) muestra 3 números en cero + un botón "OK".
Hay que reemplazarlo por el dashboard real del monolito (`renderDashboard`, `origin/main:
index.html:4640+`), que en `main` incluye: separación de servicios en el valor de inventario,
columna "Producto" en movimientos recientes, y el banner de "Compra Urgente" (feature que v2
ya implementó).

## Alcance (contenido, orden del monolito)

1. **Banner "Productos Compra Urgente"** — solo si hay faltantes; clickable → `/cuaderno/compra-urgente`. Reusa `getComprasUrgentes()` (ya existe).
2. **6 tarjetas KPI**:
   - Productos (en catálogo) · Bodegas (activas) · **Valor inventario** (solo inventariables, costo PPP) con **sub-línea Servicios** (no-inventariables) · Movimientos (no anulados) · **Stock bajo** (nº de productos bajo mínimo) · **Por vencer** (nº de lotes con saldo y `fechaVenc` ≤ 30 días).
3. **Movimientos recientes** (últimos 8, no anulados): N° · Tipo · Fecha · Bodega · **Producto** (1er ítem + "+N") · Items · Valor. Fila → `/movimientos/[numero]`.
4. **Acciones rápidas** (gated por permiso): Registrar entrada/salida (`movimientos.crear`), Nuevo producto (`productos.crear`), Ver stock.
5. **Tabla de stock bajo** (top 8): Producto · Bodega · Stock · Mínimo.

## Decisiones

- **Sin `zod.parse` de la salida**: el stub parsea con `dashboardStatsSchema`; una query tipada
  no necesita validar su propia salida → se elimina el schema y se usa el tipo.
- **Stock bajo**: producto con `stockMinimo > 0` && `inventariable` && stock total ≤ mínimo.
  Una fila por bodega con stock; si no tiene stock en ninguna, fila "Sin existencias".
- **Por vencer**: tarjeta con conteo (lotes `cantidad > 0` && `fechaVenc` ≤ hoy+30d). El modal
  de detalle del monolito queda **fuera de alcance** (solo conteo).
- **Rol `opconteos`**: no ve el dashboard por el gating del sidebar; no se replica el redirect
  especial del monolito.
- **Sin gráficos** (el monolito no tiene en esta vista).

## Arquitectura (capas)

- `src/utils/dashboard.utils.ts` (NUEVO, **puro + testeado**):
  - `esStockBajo(inventariable, stockMinimo, stockTotal): boolean`
  - `labelProductoMovimiento(primeraDescripcion, totalLineas): string` (`"X"` / `"X +2"` / `"—"`)
  - `loteVencePronto(fechaVenc, hoyMs, diasVentana): boolean`
- `src/constants/dashboard.constants.ts` (MODIFICAR): título/subtítulo reales + `LOTE_VENCE_DIAS = 30` + `MOVIMIENTOS_RECIENTES = 8` + `STOCK_BAJO_TOP = 8` + labels de tarjetas.
- `src/types/dashboard.types.ts` (MODIFICAR): ampliar `DashboardStats` con todos los KPIs, `valorServicios`, `movimientosRecientes: MovimientoResumen[]`, `stockBajo: StockBajoRow[]`, `comprasUrgentesCount`, `porVencerCount`. Tipos `MovimientoResumen` y `StockBajoRow`.
- `src/schemas/dashboard.schema.ts`: se elimina (o se deja de usar; borrar el `.parse`).
- `src/server/dashboard/dashboard.queries.ts` (REESCRIBIR): `getDashboardStats()` agrega en
  paralelo (`Promise.all`): counts (productos, bodegas activas, movimientos no anulados),
  valor inventario/servicios (join stock↔products, split por `inventariable`), stock bajo
  (stock agregado por producto vs `stockMinimo`), lotes por vencer (count), movimientos
  recientes (8 no anulados + primer producto por movimiento), y `getComprasUrgentes().length`.
  Reusa `getStockResumenPorProducto`. Usa los utils puros para los derivados.
- `src/app/(app)/dashboard/(sections)/` (NUEVO, 1 componente por archivo, regla 10):
  `dashboard.compra-urgente-banner.tsx`, `dashboard.kpis.tsx`, `dashboard.movimientos-recientes.tsx`,
  `dashboard.acciones.tsx`, `dashboard.stock-bajo.tsx`; `dashboard.view.tsx` los orquesta
  (server component, llama `getDashboardStats` + `getUsuarioActual` para gating de acciones).

## Testing

- **Unit (vitest)**: los 3 utils puros (`esStockBajo`, `labelProductoMovimiento`, `loteVencePronto`) con casos borde.
- **Build**: `pnpm build` compila el dashboard.
- **e2e** (deploy develop): login → `/dashboard` renderiza KPIs reales, movimientos recientes con Producto, banner de Compra Urgente (hay faltantes en develop), tabla de stock bajo; acciones rápidas según rol.

## Fuera de alcance
- Modal de detalle de "por vencer".
- Gráficos.
- Redirect especial de `opconteos`.
