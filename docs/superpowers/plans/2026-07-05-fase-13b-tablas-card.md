# Fase 13b — Tablas → vista card en móvil Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que las tablas de datos del `DataTable` genérico se muestren como tarjetas apiladas en móvil (`< md`) y como tabla en desktop, sin tocar cada ruta.

**Architecture:** Se extiende el `DataTable` genérico (`src/components/ui/data-table.tsx`): con `useIsMobile()` (Fase 13a) elige entre el `<Table>` actual y una lista de cards (`DataTableCards`, componente nuevo). Toolbar y paginación se comparten en ambos modos. Card genérica automática (label del header : valor) + prop opcional `renderCard` para layouts a medida. Ninguna de las ~15 rutas consumidoras cambia.

**Tech Stack:** React 19 · @tanstack/react-table · Tailwind v4. Depende de Fase 13a (`useIsMobile` en `src/hooks/use-is-mobile.ts`).

## Global Constraints

- Arquitectura por capas (ADR-013). `components` puede importar `hooks` (verificado en `eslint.config.mjs`, regla `boundaries/dependencies`, `from: ["components","hooks"]`).
- Arrow functions (excepto shadcn vendored). Sin `;`. Comillas dobles. **Sin `any` ni `as`** — tipar con genéricos de TanStack (`Row<TData>`, `Table<TData>`).
- Un componente por archivo. Corte móvil: `useIsMobile()` (`< 768px`).
- Package manager **pnpm**. Verificación: `pnpm typecheck && pnpm lint && pnpm test && pnpm build` (298 tests verdes). Sin tests de componentes.
- Prerrequisito: Fase 13a mergeada en `develop` (o rebase de esta rama sobre ella).

---

### Task 1: Componente `DataTableCards` (card genérica + slot `renderCard`)

**Files:**
- Create: `src/components/ui/data-table-card.tsx`

**Interfaces:**
- Consumes: `Row`, `Table`, `flexRender` de `@tanstack/react-table`.
- Produces: `DataTableCards<TData>` con props `{ table: Table<TData>; renderCard?: (row: Row<TData>) => ReactNode; emptyMessage: string }`. Consumido por `DataTable` (Task 2).

- [ ] **Step 1: Crear `data-table-card.tsx`**

Card genérica: por cada celda visible muestra `label : valor`. El label usa el `header` de la columna si es string; si es un componente (p. ej. `SortableHeader`), cae al `id` de la columna (evita `as` y no renderiza botones dentro de la card). Las entidades que quieran labels bonitos con headers no-string pasan `renderCard`.

```tsx
"use client"

import {
  flexRender,
  type Row,
  type Table,
} from "@tanstack/react-table"
import type { ReactNode } from "react"

type DataTableCardsProps<TData> = {
  table: Table<TData>
  renderCard?: (row: Row<TData>) => ReactNode
  emptyMessage: string
}

export const DataTableCards = <TData,>({
  table,
  renderCard,
  emptyMessage,
}: DataTableCardsProps<TData>) => {
  const rows = table.getRowModel().rows

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) =>
        renderCard ? (
          <div key={row.id} className="rounded-lg border p-3">
            {renderCard(row)}
          </div>
        ) : (
          <div
            key={row.id}
            className="flex flex-col gap-1.5 rounded-lg border p-3"
          >
            {row.getVisibleCells().map((cell) => {
              const header = cell.column.columnDef.header
              const label = typeof header === "string" ? header : cell.column.id
              return (
                <div
                  key={cell.id}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-right font-medium">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </span>
                </div>
              )
            })}
          </div>
        ),
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificar y commit**

Run: `pnpm typecheck && pnpm lint`
Expected: sin errores (sin `as`; el narrowing `typeof header === "string"` es suficiente).

```bash
git add src/components/ui/data-table-card.tsx
git commit -m "feat(ui): DataTableCards (vista card genérica del DataTable)"
```

---

### Task 2: Rama móvil en `DataTable`

**Files:**
- Modify: `src/components/ui/data-table.tsx`

**Interfaces:**
- Consumes: `useIsMobile` (`@/hooks/use-is-mobile`), `DataTableCards` (Task 1), `Row` de `@tanstack/react-table`.
- Produces: `DataTable` gana prop opcional `renderCard?: (row: Row<TData>) => ReactNode`. API existente intacta (retrocompatible con los ~15 consumidores).

- [ ] **Step 1: Ampliar imports y props**

En `data-table.tsx`, añadir a los imports de `@tanstack/react-table` el tipo `Row`, e importar el hook y el componente nuevo:

```tsx
import { useIsMobile } from "@/hooks/use-is-mobile"
import { DataTableCards } from "@/components/ui/data-table-card"
```

Ampliar el type de props:

```tsx
type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  toolbar?: (table: TanstackTable<TData>) => ReactNode
  emptyMessage?: string
  renderCard?: (row: Row<TData>) => ReactNode
}
```

y desestructurar `renderCard` en los parámetros del componente.

- [ ] **Step 2: Llamar el hook y ramificar el render**

Tras crear `table` (después de `useReactTable(...)`), añadir:

```tsx
  const isMobile = useIsMobile()
```

Reemplazar el bloque `<div className="rounded-lg border"><Table>…</Table></div>` por una ramificación (la tabla desktop actual queda intacta dentro del `else`):

```tsx
      {isMobile ? (
        <DataTableCards
          table={table}
          renderCard={renderCard}
          emptyMessage={emptyMessage}
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            {/* …TableHeader/TableBody actuales, sin cambios… */}
          </Table>
        </div>
      )}
```

`{toolbar?.(table)}` arriba y `<DataTablePagination table={table} />` abajo se mantienen fuera de la ramificación (comunes a ambos modos).

- [ ] **Step 3: Verificar y commit**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: build verde; ningún consumidor existente se rompe (prop nueva opcional).

```bash
git add src/components/ui/data-table.tsx
git commit -m "feat(responsive): DataTable renderiza cards en móvil (< md)"
```

---

### Task 3: (Opcional/diferible) cards a medida para rutas de alto tráfico

**Files:**
- Modify (opcional): `src/app/(app)/productos/(sections)/productos.view.tsx` (o donde se monte el `DataTable`), `stock.view.tsx`, `movimientos.view.tsx`

**Interfaces:** cada `renderCard` recibe `Row<TData>` y devuelve el layout de la card.

- [ ] **Step 1: Decidir si se hace ahora**

El fallback genérico (Task 1/2) ya cubre estas rutas. Solo implementar `renderCard` a medida si la card genérica se ve pobre en productos/stock/movimientos (headers no-string → labels = id de columna). Si se difiere, dejar constancia en HANDOFF ("cards a medida: backlog"). **No** es bloqueante para cerrar 13b.

- [ ] **Step 2 (si se hace): ejemplo de `renderCard` para productos**

Pasar al `<DataTable>` de la vista de productos un `renderCard` que muestre nombre/código/stock con jerarquía visual (usar los campos del tipo de fila real; sin `as`). Verificar con `pnpm typecheck && pnpm lint && pnpm build` y commit.

---

### Task 4: Verificación manual + HANDOFF

**Files:**
- Modify: `docs/HANDOFF.md`

- [ ] **Step 1: Levantar y revisar**

Run: `pnpm dev`. DevTools a 375px y a ~768px, tema claro y oscuro. En `/productos`, `/stock`, `/movimientos`, `/clientes`, `/usuarios`, `/tomas`, `/mantenciones`:

- [ ] A `< md`: cada fila se ve como card apilada (label : valor), legible y sin scroll horizontal.
- [ ] El buscador/filtro de la toolbar sigue filtrando las cards.
- [ ] La paginación sigue funcionando (cambiar página / filas por página).
- [ ] A `≥ md`: se ve la tabla de siempre, idéntica a hoy.
- [ ] Sin scroll horizontal del `body`.

- [ ] **Step 2: Verificación automática**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: 298 tests verdes; build verde.

- [ ] **Step 3: HANDOFF + PR**

Marcar 13b `HECHO` en la tabla, actualizar rama activa/última actualización + bitácora. Commit, push, PR de `feat/fase-13b-tablas-card` → `develop`.

```bash
git add docs/HANDOFF.md
git commit -m "docs(handoff): Fase 13b (tablas vista card) HECHA"
git push -u origin feat/fase-13b-tablas-card
```

---

## Self-Review

- **Cobertura del spec (13b)**: `DataTable` renderiza cards en móvil (Task 2) ✓ · card genérica + `renderCard` (Task 1) ✓ · toolbar/paginación compartidos (Task 2, fuera de la ramificación) ✓ · fallback automático para todas las rutas (prop opcional, sin tocar consumidores) ✓ · cards a medida diferibles (Task 3) ✓.
- **Sin placeholders / sin `as`**: la card genérica narrowea `header` con `typeof === "string"`; los genéricos `Row<TData>`/`Table<TData>` evitan casts.
- **Consistencia de tipos**: `DataTableCards` props `{ table, renderCard?, emptyMessage }` coinciden con lo que `DataTable` le pasa en Task 2; `renderCard?: (row: Row<TData>) => ReactNode` idéntico en Task 1 y Task 2.
- **Dependencia**: requiere `useIsMobile` de 13a. Si esta rama sale de `develop` antes de mergear 13a, rebasear sobre 13a primero.
