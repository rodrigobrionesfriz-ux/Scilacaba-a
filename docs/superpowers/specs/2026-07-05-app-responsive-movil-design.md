# Diseño — App responsive / móvil (Fase 13)

**Fecha**: 2026-07-05 · **Fase**: 13 (transversal — UI responsive). Se parte en sub-fases 13a/13b/13c, cada una con rama/PR.

## Contexto

SCI v2 va a usarse en teléfonos, pero hoy la UI es **desktop-first sin infraestructura responsive**:

- Shell de dos columnas rígidas (`src/app/(app)/layout.tsx`) con **sidebar de ancho fijo `w-60 shrink-0`** siempre visible, sin hamburguesa ni drawer (`src/app/(app)/(sections)/app.sidebar.tsx:16`).
- **Sin `export const viewport`** en `src/app/layout.tsx`; **sin ningún hook de media query** (no existe `src/hooks/`).
- **Tablas** solo con scroll horizontal + `whitespace-nowrap` (`src/components/ui/table.tsx`).
- **Formularios** con `grid grid-cols-2/3` sin prefijo responsive (no colapsan a una columna).
- Buscadores/paginación con anchos fijos (`w-72`) y filas de botones que desbordan.

Ya resuelto: diálogos (`max-w-[calc(100%-2rem)] sm:max-w-*` en `dialog.tsx`) y las capturas de `/terreno`.

El objetivo es que **toda la app** sea usable y cómoda en móvil: navegación por **drawer + hamburguesa**, tablas en **vista card** en móvil, y formularios que colapsan a una columna — sin degradar la vista desktop actual.

## Alcance (por sub-fase)

**13a — Fundaciones + shell drawer + ergonomía táctil**
1. `export const viewport` en el layout raíz.
2. `useIsMobile` (hook cliente SSR-safe) + constante `MOBILE_BREAKPOINT`.
3. Componente `Sheet`/drawer sobre el `Dialog` de base-ui (panel lateral izquierdo).
4. Extracción del render de `NAV` a `<AppNav>` compartido (sidebar fijo + drawer).
5. `<AppShell>` cliente: hamburguesa + drawer (`< md`) / sidebar fijo `hidden md:flex` (`≥ md`); cierra el drawer al navegar.
6. Arreglos en primitivos compartidos: buscador de toolbar `w-full sm:w-72`, `flex-wrap` en paginación, `overflow-x-auto` en las barras de tabs (cuaderno/terreno/fertirriego).

**13b — Tablas → vista card**
1. `DataTable` genérico renderiza cards apiladas en `< md` y tabla en `≥ md`; toolbar + paginación compartidos.
2. Card genérica automática (label del header : valor) + prop opcional `renderCard` para layouts a medida.

**13c — Formularios y diálogos**
1. `grid-cols-N` → `grid-cols-1 sm:grid-cols-N` en los `*.form.tsx`.
2. Default `max-h-[90dvh] overflow-y-auto` en `DialogContent`; quitar duplicados por-formulario.
3. Anchos fijos remanentes en formularios → `w-full` en móvil.

## Decisiones (→ ADR-019, Fase 13)

- **Mobile-first adaptativo** con breakpoints default de Tailwind (sm 640 / md 768). Corte del shell: `md`.
- **Drawer** sobre el primitivo base-ui `Dialog` que ya existe (sin dependencia nueva; respeta boundaries).
- **Un solo árbol `NAV`** para sidebar y drawer (se extrae a `<AppNav>` — DRY).
- **Tablas → card en móvil** vía `useIsMobile` (no se puede resolver solo con CSS porque cambia el árbol de render: `<table>` vs lista de cards). Fallback genérico cubre las ~15 rutas; cards a medida (productos/stock/movimientos) son diferibles.
- **Ergonomía táctil sin inflar desktop**: no se cambia el tamaño global de `Button`; se asegura área táctil solo en controles tocados en móvil (nav del drawer, paginación, toolbar).
- **Sin doc de módulo**: responsive es transversal (sin server actions ni entidad), como la sesión "Performance + UI".

## Arquitectura (capas)

- `src/constants/responsive.constants.ts` (NUEVO): `MOBILE_BREAKPOINT = 768` (regla 7).
- `src/hooks/use-is-mobile.ts` (NUEVO, primer hook compartido): `useIsMobile()` con `matchMedia`, SSR-safe (server → `false`, sincroniza en `useEffect`, escucha `change`). Arrow function, sin `as`.
- `src/components/ui/sheet.tsx` (NUEVO): panel lateral sobre base-ui `Dialog` (posición `left`, slide-in). Reusa el patrón de `dialog.tsx`.
- `src/app/(app)/(sections)/app.nav.tsx` (NUEVO): render de `NAV` + `itemVisible` (hoy inline en `app.sidebar.tsx:31-81`), compartido.
- `src/app/(app)/(sections)/app.shell.tsx` (NUEVO, client): estado `open` del drawer; compone topbar (hamburguesa `< md`), sidebar fijo (`hidden md:flex`) y drawer (`md:hidden`); cierra al cambiar `usePathname`.
- `src/app/layout.tsx` (MODIFICAR): `export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" }`.
- `src/app/(app)/layout.tsx` (MODIFICAR): server sigue con `requireAuth()`, pasa `usuario` a `<AppShell>`.
- `src/app/(app)/(sections)/app.sidebar.tsx` (MODIFICAR): usa `<AppNav>`; `<aside>` → `hidden md:flex`.
- `src/app/(app)/(sections)/app.topbar.tsx` (MODIFICAR): botón hamburguesa `< md` (`lucide` `Menu`) → `onOpenMenu`.
- `src/components/ui/data-table.tsx` (MODIFICAR, 13b): rama móvil con cards + prop `renderCard?`; extraer `data-table-card.tsx` si crece.
- `src/components/ui/data-table-toolbar.tsx`, `data-table-pagination.tsx` (MODIFICAR, 13a): ancho de buscador y `flex-wrap`.
- `src/components/ui/dialog.tsx` (MODIFICAR, 13c): default `max-h/overflow` en `DialogContent`.
- `*.form.tsx` bajo `src/app/**/(sections)/` (MODIFICAR, 13c): grids responsive.

## Testing

- **Sin tests de componentes/hook**: vitest corre en entorno `node` e incluye solo `src/**/*.{test,spec}.ts` (los 298 tests son de funciones puras en `utils/`). La UI del proyecto no tiene tests de componentes — no se cambia esa política ni el entorno solo por esta fase. `useIsMobile` y el shell se verifican **manualmente** (como todas las fases de UI previas).
- **Build/typecheck/lint/prettier**: verdes por sub-fase (baseline: 298 tests siguen verdes, `semi:false`, comillas dobles).
- **e2e/manual (DevTools, 375px + ~768px, claro y oscuro)**:
  - 13a: hamburguesa abre/cierra drawer; cierra al navegar; sidebar fijo en `≥ md`; tabs con scroll; sin overflow horizontal del `body`.
  - 13b: listas como cards en móvil / tabla en desktop, con filtro/orden/paginación operativos.
  - 13c: formularios en una columna con scroll interno; footer apilado.
- **Regresión desktop**: a `≥ md` la app se ve igual que hoy.

## Fuera de alcance

- Cards a medida por entidad (productos/stock/movimientos) — diferibles; el fallback genérico cubre todo.
- Tablas manuales (`config.*.section.tsx`, `estimacion.detalle.tsx`): quedan con su `overflow-x-auto` actual.
- Cambiar el tamaño global de `Button` / rediseñar densidad desktop.
- Bottom navigation nativa (se eligió drawer + hamburguesa).
