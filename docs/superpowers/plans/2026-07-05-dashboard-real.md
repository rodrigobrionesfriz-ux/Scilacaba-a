# Dashboard real — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Reemplazar el stub del dashboard por la réplica fiel del monolito `main`: KPIs reales, valor inventario/servicios, movimientos recientes con producto, banner de Compra Urgente, y tabla de stock bajo.

**Architecture:** Query agregada server-side (`getDashboardStats`) con lógica derivada en utils puros testeados; vista compuesta en sub-componentes (1 por archivo). Reusa `getComprasUrgentes` y `getStockResumenPorProducto`.

**Tech Stack:** Next.js 16 (server components), Drizzle (pg), vitest, shadcn/base-ui.

## Global Constraints

- Estilo: arrow functions, **sin `;`**, comillas dobles, **nunca `any`/`as`** (usar `z.infer`/`unknown`+narrowing).
- Capas: datos en `src/server`; utils puros en `src/utils`; tipos en `src/types`; constantes en `src/constants` (nunca inline); página ≤20 líneas que compone; componentes de ruta en `(sections)/`, 1 por archivo.
- Verde: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.
- Referencia: `docs/superpowers/specs/2026-07-05-dashboard-design.md`; monolito `git show origin/main:index.html` (`renderDashboard`, ~4640).

---

## Task 1: Utils puros + constantes + tipos

**Files:**
- Create: `src/utils/dashboard.utils.ts`, `src/utils/dashboard.utils.test.ts`
- Modify: `src/constants/dashboard.constants.ts`, `src/types/dashboard.types.ts`

**Interfaces:**
- Produces: `esStockBajo(inventariable: boolean, stockMinimo: number, stockTotal: number): boolean`; `labelProductoMovimiento(primera: string, totalLineas: number): string`; `loteVencePronto(fechaVenc: string | null, hoyMs: number, dias: number): boolean`. Tipos `DashboardStats`, `MovimientoResumen`, `StockBajoRow`. Constantes `LOTE_VENCE_DIAS`, `MOVIMIENTOS_RECIENTES`, `STOCK_BAJO_TOP`, `DASHBOARD_TITLE`, `DASHBOARD_SUBTITLE`.

- [ ] **Step 1: Escribir el test (falla)**

Create `src/utils/dashboard.utils.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import {
  esStockBajo,
  labelProductoMovimiento,
  loteVencePronto,
} from "@/utils/dashboard.utils"

describe("esStockBajo", () => {
  it("bajo cuando total <= mínimo y hay mínimo e inventariable", () => {
    expect(esStockBajo(true, 10, 10)).toBe(true)
    expect(esStockBajo(true, 10, 3)).toBe(true)
  })
  it("no aplica sin mínimo, no inventariable, o con stock suficiente", () => {
    expect(esStockBajo(true, 0, 0)).toBe(false)
    expect(esStockBajo(false, 10, 0)).toBe(false)
    expect(esStockBajo(true, 10, 11)).toBe(false)
  })
})

describe("labelProductoMovimiento", () => {
  it("sin líneas → guión", () => {
    expect(labelProductoMovimiento("", 0)).toBe("—")
  })
  it("una línea → nombre", () => {
    expect(labelProductoMovimiento("Aceite", 1)).toBe("Aceite")
  })
  it("varias → nombre +N", () => {
    expect(labelProductoMovimiento("Aceite", 3)).toBe("Aceite +2")
  })
})

describe("loteVencePronto", () => {
  const hoy = Date.UTC(2026, 0, 1)
  it("vence dentro de la ventana", () => {
    expect(loteVencePronto("2026-01-20", hoy, 30)).toBe(true)
  })
  it("fuera de ventana o sin fecha", () => {
    expect(loteVencePronto("2026-03-01", hoy, 30)).toBe(false)
    expect(loteVencePronto(null, hoy, 30)).toBe(false)
  })
})
```

- [ ] **Step 2: Correr (falla)**

Run: `pnpm test src/utils/dashboard.utils.test.ts` — FAIL (util no existe).

- [ ] **Step 3: Implementar utils**

Create `src/utils/dashboard.utils.ts`:

```ts
// Lógica pura del dashboard (regla 8). Sin I/O.

// Un producto está bajo mínimo si es inventariable, tiene mínimo definido y su
// existencia total no lo supera (espejo de renderDashboard del monolito).
export const esStockBajo = (
  inventariable: boolean,
  stockMinimo: number,
  stockTotal: number,
): boolean => inventariable && stockMinimo > 0 && stockTotal <= stockMinimo

// Etiqueta de producto para la fila de movimiento: primer producto + "+N" extra.
export const labelProductoMovimiento = (
  primera: string,
  totalLineas: number,
): string => {
  if (totalLineas <= 0 || primera === "") return "—"
  return totalLineas > 1 ? `${primera} +${totalLineas - 1}` : primera
}

// Un lote vence pronto si tiene fecha y cae dentro de [hoy, hoy+dias].
export const loteVencePronto = (
  fechaVenc: string | null,
  hoyMs: number,
  dias: number,
): boolean => {
  if (!fechaVenc) return false
  const venceMs = new Date(fechaVenc).getTime()
  return Number.isFinite(venceMs) && venceMs < hoyMs + dias * 86400000
}
```

- [ ] **Step 4: Correr (pasa)**

Run: `pnpm test src/utils/dashboard.utils.test.ts` — PASS.

- [ ] **Step 5: Constantes**

Reemplaza el contenido de `src/constants/dashboard.constants.ts`:

```ts
// Constantes del dashboard (regla 7). Hoja.
export const DASHBOARD_TITLE = "Resumen"
export const DASHBOARD_SUBTITLE = "Estado actual del inventario"

export const LOTE_VENCE_DIAS = 30
export const MOVIMIENTOS_RECIENTES = 8
export const STOCK_BAJO_TOP = 8
```

- [ ] **Step 6: Tipos**

Reemplaza `src/types/dashboard.types.ts`:

```ts
// Tipos del dashboard (regla 12). Hoja.
export type MovimientoResumen = {
  numero: string
  tipoMovimiento: string
  direccion: "ENT" | "SAL"
  fecha: string
  bodega: string
  producto: string
  items: number
  valor: number
}

export type StockBajoRow = {
  codigoInterno: string
  descripcion: string
  bodega: string
  cantidad: number
  minimo: number
}

export type DashboardStats = {
  totalProductos: number
  totalBodegas: number
  totalMovimientos: number
  valorInventario: number
  valorServicios: number
  stockBajoCount: number
  porVencerCount: number
  comprasUrgentesCount: number
  movimientosRecientes: MovimientoResumen[]
  stockBajo: StockBajoRow[]
}
```

- [ ] **Step 7: typecheck + lint + test**

Run: `pnpm typecheck && pnpm lint && pnpm test` — PASS. (Nota: `dashboard.queries.ts` seguirá refiriéndose al viejo tipo; si typecheck falla ahí, es esperado — se arregla en Task 2. Si bloquea, deja `getDashboardStats` devolviendo el nuevo tipo con ceros temporalmente; Task 2 lo implementa.)

- [ ] **Step 8: Commit**

```bash
git add src/utils/dashboard.utils.ts src/utils/dashboard.utils.test.ts src/constants/dashboard.constants.ts src/types/dashboard.types.ts
git commit -m "feat(dashboard): utils puros, constantes y tipos del dashboard real"
```

---

## Task 2: `getDashboardStats` — query agregada real

**Files:**
- Modify: `src/server/dashboard/dashboard.queries.ts`
- Delete: `src/schemas/dashboard.schema.ts` (ya no se usa)

**Interfaces:**
- Consumes: utils de Task 1; `getComprasUrgentes()` (`@/server/compras-urgentes/compras-urgentes.queries`); `getStockResumenPorProducto()`; schemas drizzle `products`, `warehouses`, `movements`, `movementLines`, `stock`, `lots`.
- Produces: `getDashboardStats(): Promise<DashboardStats>`.

- [ ] **Step 1: Reescribir la query**

Reemplaza `src/server/dashboard/dashboard.queries.ts` con una implementación que arma `DashboardStats`. Investiga primero (regla 14) las columnas exactas: `products.inventariable/stockMinimo/codigoInterno/descripcion`, `warehouses.activo/nombre/id`, `movements.numero/anulado/fecha/tipoMovimiento/direccion/bodegaId`, `movementLines.movementNumero/codigoInterno/cantidad/costo`, `stock.codigoInterno/bodegaId/cantidad/costoPromedio`, `lots.cantidad/fechaVenc`. Estructura:

```ts
import { and, desc, eq, sql } from "drizzle-orm"
import {
  LOTE_VENCE_DIAS,
  MOVIMIENTOS_RECIENTES,
  STOCK_BAJO_TOP,
} from "@/constants/dashboard.constants"
import { db } from "@/db/client"
import {
  lots,
  movementLines,
  movements,
  products,
  stock,
  warehouses,
} from "@/db/schema"
import { getComprasUrgentes } from "@/server/compras-urgentes/compras-urgentes.queries"
import type {
  DashboardStats,
  MovimientoResumen,
  StockBajoRow,
} from "@/types/dashboard.types"
import {
  esStockBajo,
  labelProductoMovimiento,
} from "@/utils/dashboard.utils"

export const getDashboardStats = async (): Promise<DashboardStats> => {
  // ...agregaciones (ver pasos). Devuelve DashboardStats.
}
```

Implementa cada parte:

1. **Counts + valores** — un par de queries agregadas:
   - `totalProductos`: `count(*)` de `products`.
   - `totalBodegas`: `count(*)` de `warehouses` where `activo`.
   - `totalMovimientos`: `count(*)` de `movements` where `not anulado`.
   - **Valor inventario/servicios**: join `stock`↔`products`, sumar `cantidad*costoPromedio` agrupado por `products.inventariable`; el grupo `true` → `valorInventario`, `false` → `valorServicios`.

2. **Stock bajo**: trae por producto `{ codigoInterno, descripcion, inventariable, stockMinimo }` + su stock por bodega (join `stock`). Agrupa el total por producto, aplica `esStockBajo(inventariable, Number(stockMinimo), totalProducto)`. Para los que califican, arma filas `StockBajoRow` (una por bodega con stock; si no hay, `bodega: "Sin existencias"`, `cantidad: 0`). `stockBajoCount` = nº de productos distintos bajo mínimo; `stockBajo` = primeras `STOCK_BAJO_TOP` filas.

3. **Por vencer**: `count(*)` de `lots` where `cantidad > 0 and fecha_venc is not null and fecha_venc < current_date + INTERVAL '30 days'` (usa `LOTE_VENCE_DIAS` interpolado como número con `sql`). → `porVencerCount`.

4. **Movimientos recientes**: `movements` where `not anulado` order by `fecha desc` limit `MOVIMIENTOS_RECIENTES`, join `warehouses` para el nombre de bodega. Para el producto: subconsulta/segunda query a `movementLines` join `products` filtrando esos números; agrupa por `movementNumero` → `{ items: count, valor: sum(cantidad*costo), primeraDescripcion }` (primera por `min(id)` o el primer row). Arma `MovimientoResumen` con `producto: labelProductoMovimiento(primeraDescripcion, items)`.

5. **Compras urgentes**: `comprasUrgentesCount = (await getComprasUrgentes()).length`.

Combina todo en `Promise.all` donde sea independiente. Mapea numeric→Number, timestamp→`.toISOString()`, null→"".

- [ ] **Step 2: Borrar el schema no usado**

```bash
git rm src/schemas/dashboard.schema.ts
```

Verifica que nada más lo importe: `grep -rn "dashboard.schema" src/` → 0 resultados (si hay, elimínalos).

- [ ] **Step 3: typecheck + lint + test**

Run: `pnpm typecheck && pnpm lint && pnpm test` — PASS.

- [ ] **Step 4: Commit**

```bash
git add src/server/dashboard/dashboard.queries.ts
git commit -m "feat(dashboard): query agregada real (KPIs, valor inv/servicios, recientes, stock bajo)"
```

---

## Task 3: Vista + sub-componentes

**Files:**
- Modify: `src/app/(app)/dashboard/(sections)/dashboard.view.tsx`
- Create: `dashboard.compra-urgente-banner.tsx`, `dashboard.kpis.tsx`, `dashboard.movimientos-recientes.tsx`, `dashboard.acciones.tsx`, `dashboard.stock-bajo.tsx` (todos en `src/app/(app)/dashboard/(sections)/`)

**Interfaces:**
- Consumes: `getDashboardStats()`, `getUsuarioActual()`, `can()`, tipos de Task 1.

- [ ] **Step 1: Investigar patrones**

Lee `src/app/(app)/dashboard/(sections)/dashboard.view.tsx` (actual), un ejemplo de tarjetas/tabla existente (p. ej. `mantenciones.kpis.tsx` o `presupuesto.kpis.tsx`), y cómo se formatea moneda (`@/utils/money.utils` `formatCLP`). Usa los componentes `@/components/ui` existentes. Rutas: usa strings (`/movimientos/entradas`, `/movimientos/salidas`, `/productos`, `/stock`, `/movimientos/${numero}`, `/cuaderno/compra-urgente`).

- [ ] **Step 2: Sub-componentes (1 por archivo, arrow, sin `;`, comillas dobles)**

Crea cada sub-componente recibiendo props tipadas de `DashboardStats`:
- `dashboard.compra-urgente-banner.tsx`: recibe `count: number`; si `count > 0`, renderiza un banner (link a `/cuaderno/compra-urgente`) con el conteo; si 0, `return null`.
- `dashboard.kpis.tsx`: recibe los KPIs; grid de 6 tarjetas (Productos, Bodegas, Valor inventario + sub-línea Servicios con `formatCLP`, Movimientos, Stock bajo, Por vencer).
- `dashboard.movimientos-recientes.tsx`: recibe `movimientos: MovimientoResumen[]`; tabla con columnas N°/Tipo/Fecha/Bodega/Producto/Items/Valor; cada fila enlaza a `/movimientos/${numero}`. Empty-state si vacío.
- `dashboard.acciones.tsx`: recibe flags `puedeMovimientos`, `puedeProductos`; botones-link a entradas/salidas/nuevo producto/ver stock según flags (`Button` con `render={<Link/>}` + `nativeButton={false}`).
- `dashboard.stock-bajo.tsx`: recibe `filas: StockBajoRow[]`; si vacío, `return null`; si no, tabla Producto/Bodega/Stock/Mínimo.

- [ ] **Step 3: Orquestar la vista**

Reemplaza `dashboard.view.tsx` (server component) para: `const [stats, usuario] = await Promise.all([getDashboardStats(), getUsuarioActual()])`, y componer banner → kpis → grid (recientes + acciones) → stock bajo, pasando `can(usuario, "movimientos.crear")` y `can(usuario, "productos.crear")` a acciones. Sin el botón "OK" del stub.

- [ ] **Step 4: typecheck + lint + build**

Run: `pnpm typecheck && pnpm lint && pnpm build` — PASS; `/dashboard` compila.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/dashboard/"
git commit -m "feat(dashboard): vista real (banner CU, KPIs, recientes, acciones, stock bajo)"
```

---

## Task 4: Verificación e2e + PR

- [ ] **Step 1: Suite completa**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build` — todo PASS.

- [ ] **Step 2: e2e (deploy develop o `pnpm start`)**

Login → `/dashboard`: KPIs con números reales (no ceros), valor inventario + servicios, movimientos recientes con columna Producto, banner de Compra Urgente (hay faltantes en develop), tabla de stock bajo; acciones rápidas visibles según rol.

- [ ] **Step 3: Push + PR a develop**

```bash
git push -u origin feat/dashboard-real
gh pr create --base develop --title "feat(dashboard): dashboard real (réplica del monolito main)" --body "Implementa el ítem 1 de docs/gap-monolito-main.md. Spec: docs/superpowers/specs/2026-07-05-dashboard-design.md."
```

Espera CI verde antes de mergear.

---

## Self-Review

- Banner CU (T3) reusa `getComprasUrgentes` vía count en `getDashboardStats` (T2). ✓
- Valor inventario/servicios split por `inventariable` (T2). ✓
- Columna Producto vía `labelProductoMovimiento` (T1) + primer producto por movimiento (T2). ✓
- Stock bajo: util `esStockBajo` (T1) + agregación (T2) + tabla (T3). ✓
- Por vencer: conteo (T2) + tarjeta (T3); modal fuera de alcance. ✓
- Sin `zod.parse` (schema borrado, T2). ✓
- Reglas de estilo/capas en cada task. ✓
- Riesgo: la query de movimientos recientes con "primer producto" requiere una 2ª consulta a `movementLines`; si el volumen fuera alto, es aceptable (limit 8). Verificar en build/e2e.
