# Fase 13c — Formularios y diálogos responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que los formularios (en modal) colapsen a una columna en móvil y no desborden verticalmente.

**Architecture:** (1) Barrido mecánico: `grid grid-cols-N` sin prefijo → `grid grid-cols-1 sm:grid-cols-N` en los `*.form.tsx`. (2) Default `max-h-[90dvh] overflow-y-auto` en `DialogContent` (`src/components/ui/dialog.tsx`) para acotar la altura en móvil de forma consistente; los `max-h` por-formulario quedan redundantes (limpieza opcional). Excepciones: las capturas de `/terreno` (layout táctil intencional) no se colapsan.

**Tech Stack:** Tailwind v4 · base-ui `Dialog`. Independiente de 13b; depende de 13a solo por convivencia de rama (sale de `develop`).

## Global Constraints

- Arquitectura por capas (ADR-013). Solo cambios de className/estructura de layout; sin lógica nueva.
- Arrow functions (excepto shadcn vendored `dialog.tsx`). Sin `;`. Comillas dobles. Sin `any`/`as`.
- Breakpoint de colapso: `sm` (640px). Package manager **pnpm**.
- Verificación: `pnpm typecheck && pnpm lint && pnpm test && pnpm build` (298 tests verdes) + Prettier. Sin tests de componentes.

---

### Task 1: Default de altura/scroll en `DialogContent`

**Files:**
- Modify: `src/components/ui/dialog.tsx:56`

**Interfaces:** sin cambio de API; el default aplica a todos los diálogos.

- [ ] **Step 1: Añadir el default al className de `DialogContent`**

En `dialog.tsx`, el `className` del `DialogPrimitive.Popup` (línea ~56) empieza con `"fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] ..."`. Insertar `max-h-[90dvh] overflow-y-auto` (antes de `sm:max-w-sm`):

```tsx
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid max-h-[90dvh] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
```

Nota: `cn()` usa tailwind-merge, así que un `max-h-*`/`overflow-*` pasado por un consumidor sigue ganando sobre el default (no rompe los diálogos que ya lo especifican, p. ej. `presupuesto.detalle-modal.tsx` con `overflow-hidden`).

- [ ] **Step 2: Verificar y commit**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: build verde.

```bash
git add src/components/ui/dialog.tsx
git commit -m "feat(responsive): DialogContent acota altura (max-h-[90dvh] overflow-y-auto)"
```

---

### Task 2: Colapsar grids de formularios a una columna en móvil

**Files (transformación uniforme `grid grid-cols-N gap-*` → `grid grid-cols-1 sm:grid-cols-N gap-*`):**
- `src/app/(app)/productos/(sections)/productos.form.tsx:137,166,293,311`
- `src/app/(app)/centros-costo/(sections)/centros-costo.form.tsx:95`
- `src/app/(app)/mantenciones/(sections)/mantenciones.form.tsx:187`
- `src/app/(app)/mantenciones/(sections)/mantenciones.factura-form.tsx:98`
- `src/app/(app)/tomas/(sections)/tomas.iniciar.tsx:139`
- `src/app/(app)/cuaderno/panos/(sections)/panos.form.tsx:96,115,136`
- `src/app/(app)/cuaderno/aplicaciones/(sections)/aplicaciones.form.tsx:121,152,198,247`
- `src/app/(app)/cuaderno/productos/(sections)/productos-cuaderno.form.tsx:113,150`
- `src/app/(app)/cuaderno/ordenes/(sections)/ordenes.form.tsx:274,301`
- `src/app/(app)/cuaderno/ordenes/(sections)/ordenes.confirmar.tsx:98,189`
- `src/app/(app)/cuaderno/fertirriego/sectores/(sections)/sectores.form.tsx:89,109`
- `src/app/(app)/cuaderno/fertirriego/productos/(sections)/aportes.form.tsx:104` (ver excepción del grid de aportes abajo)

**Casos especiales:**
- Formularios de **proveedores/clientes**: sus campos vienen de un módulo compartido (`entidad-comercial.fields`). Buscar el `grid-cols-*` allí (`grep -rn "grid-cols" src/app/(app)/proveedores src/app/(app)/clientes src/**/entidad-comercial*`) y aplicar la misma regla en el origen compartido, una sola vez.
- **Grid de aportes N-P-K…** (`aportes.form.tsx:128`, `grid-cols-4`): colapsar solo a `grid-cols-2 sm:grid-cols-4` (4 columnas de nutrientes en una sola columna quedan demasiado altas).

**Excluir (NO tocar — layout táctil intencional):**
- `src/app/(app)/terreno/conteos/(sections)/conteos.capture.tsx:217`
- `src/app/(app)/terreno/invplantas/(sections)/invplantas.capture.tsx:233,318`

**Interfaces:** solo className.

- [ ] **Step 1: Aplicar la regla base en los formularios listados**

Para cada línea listada (salvo las excepciones): `grid grid-cols-2 gap-3` → `grid grid-cols-1 gap-3 sm:grid-cols-2`; `grid grid-cols-3 gap-3` → `grid grid-cols-1 gap-3 sm:grid-cols-3`. Hacer los reemplazos por archivo (no un `sed` global ciego — revisar cada match para no tocar grids que ya tengan prefijo ni los de terreno).

- [ ] **Step 2: Aplicar los casos especiales**

- `aportes.form.tsx:128`: `grid grid-cols-4 gap-2` → `grid grid-cols-2 gap-2 sm:grid-cols-4`.
- proveedores/clientes: editar el `grid-cols-*` en el archivo de campos compartido.

- [ ] **Step 3: Verificar y commit**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: build verde.

```bash
git add "src/app/(app)"
git commit -m "feat(responsive): formularios colapsan a 1 columna en móvil (sm:grid-cols-*)"
```

---

### Task 3: (Opcional) limpiar `max-h` redundantes por-formulario

**Files:** los ~23 `*.form.tsx`/`*.detalle.tsx` con `max-h-[85vh] overflow-y-auto` / `max-h-[90vh] overflow-y-auto` en su `DialogContent` (lista vía `grep -rn "max-h-\[8[05]vh\]\|max-h-\[90vh\]" "src/app/(app)"`).

- [ ] **Step 1: Decidir**

Con el default de Task 1, estos son redundantes. Limpiarlos es cosmético y reduce ruido, pero toca muchos archivos. **Opcional**: quitar solo `max-h-[85vh] overflow-y-auto ` (dejando el `sm:max-w-*`) en los formularios simples; **no** tocar los que usan `overflow-hidden` u otra semántica (`presupuesto.detalle-modal.tsx`). Si se difiere, no bloquea el cierre de 13c.

- [ ] **Step 2 (si se hace): verificar y commit**

Run: `pnpm typecheck && pnpm lint && pnpm build` y revisar visualmente que ningún modal desborde. Commit.

---

### Task 4: Verificación manual + HANDOFF

**Files:**
- Modify: `docs/HANDOFF.md`

- [ ] **Step 1: Revisar en DevTools (375px y ~768px, claro y oscuro)**

Abrir modales de: crear/editar producto, iniciar toma, orden de aplicación (`ordenes.form`), OAF (`oaf.form`), aportes, empresa (`config.empresa`), usuario, proveedor/cliente:

- [ ] A `< sm`: los campos se apilan en una columna; el modal hace scroll interno sin desbordar la pantalla; los botones del footer se apilan (ya lo hace `DialogFooter`).
- [ ] El grid de aportes muestra 2 columnas en móvil (no 4, no 1).
- [ ] Las capturas de `/terreno` (conteos/invplantas) conservan su layout táctil de 2 columnas.
- [ ] A `≥ sm`: el layout multi-columna se mantiene idéntico a hoy.

- [ ] **Step 2: Verificación automática**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: 298 tests verdes; build verde. `pnpm format:check` limpio.

- [ ] **Step 3: HANDOFF + PR (cierre de Fase 13)**

Marcar 13c `HECHO` y la Fase 13 completa en la tabla; actualizar rama activa/última actualización + bitácora. Commit, push, PR de `feat/fase-13c-formularios` → `develop`.

```bash
git add docs/HANDOFF.md
git commit -m "docs(handoff): Fase 13c (formularios responsive) HECHA — cierra Fase 13"
git push -u origin feat/fase-13c-formularios
```

---

## Self-Review

- **Cobertura del spec (13c)**: grids de formulario `sm:grid-cols-*` (Task 2) ✓ · default `max-h/overflow` en `DialogContent` (Task 1) ✓ · limpieza de duplicados (Task 3, opcional) ✓ · anchos fijos remanentes en formularios → el buscador de toolbar ya se arregló en 13a; los inputs de formulario heredan `w-full` del layout de campo (verificar en Step 1 de Task 4 y ajustar puntualmente si alguno queda fijo).
- **Sin placeholders**: la transformación está dada con clase origen → clase destino exactas y la lista de archivos/líneas.
- **Excepciones explícitas**: capturas de terreno excluidas; grid de aportes a `grid-cols-2 sm:grid-cols-4`; diálogos con semántica propia (`overflow-hidden`) no se tocan.
- **Riesgo**: `cn()`/tailwind-merge garantiza que el default de Task 1 no pisa los `max-h` existentes; por eso Task 3 (limpieza) es segura y opcional.
