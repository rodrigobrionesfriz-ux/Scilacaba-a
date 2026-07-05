# Fase 13a — Fundaciones responsive + shell drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar a SCI v2 la infraestructura responsive y una navegación por drawer + hamburguesa en móvil, sin degradar la vista desktop.

**Architecture:** Se añade `export const viewport` al layout raíz, un hook cliente `useIsMobile` (SSR-safe) y una constante de breakpoint. El render de `NAV` se extrae a `<AppNav>` (compartido por el sidebar fijo y el drawer). Un `<AppShell>` cliente mantiene el estado del drawer y compone topbar (con hamburguesa `< md`) + sidebar fijo (`hidden md:flex`) + drawer (`md:hidden`, sobre el `Dialog` de base-ui). Se corrigen anchos fijos y desbordes en toolbar/paginación/tabs.

**Tech Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · base-ui (`@base-ui/react`) · lucide-react.

## Global Constraints

- Arquitectura por capas (ADR-013). Boundaries: `app` puede importar `components/hooks/lib/utils/constants` (no `db`); `components`/`hooks` importan `lib/utils/constants` (no `app`).
- Arrow functions siempre (excepto shadcn vendored en `src/components/ui/` que puede usar `function`). Sin `;` (Prettier `semi:false`). Comillas dobles. Sin `any` ni `as`.
- Un componente por archivo. Constantes en `src/constants/<x>.constants.ts` (nada inline). Hooks compartidos en `src/hooks/`.
- Breakpoints: defaults de Tailwind (sm 640 / md 768). Corte del shell: `md`.
- Package manager: **pnpm**. Verificación por tarea: `pnpm typecheck && pnpm lint && pnpm test && pnpm build` (baseline 298 tests verdes). Sin tests de componentes (vitest = entorno `node`, solo `.ts` de utils).
- Antes de tocar `viewport`: leer `node_modules/next/dist/docs` sobre el export `viewport` (regla 14 / AGENTS.md). Para el drawer, seguir el patrón de `src/components/ui/dialog.tsx` (base-ui `Dialog`).

---

### Task 1: Constante de breakpoint + hook `useIsMobile`

**Files:**
- Create: `src/constants/responsive.constants.ts`
- Create: `src/hooks/use-is-mobile.ts`

**Interfaces:**
- Produces: `MOBILE_BREAKPOINT: number` (768); `useIsMobile(): boolean` (true cuando el viewport es `< MOBILE_BREAKPOINT`; `false` en server y en el primer render).

- [ ] **Step 1: Crear la constante**

`src/constants/responsive.constants.ts`:

```ts
// Breakpoint de corte móvil/desktop (px). Coincide con `md` de Tailwind (768):
// < MOBILE_BREAKPOINT usa el shell móvil (drawer) y la vista card de tablas.
// Hoja: no importa otras capas.
export const MOBILE_BREAKPOINT = 768
```

- [ ] **Step 2: Crear el hook `useIsMobile`**

`src/hooks/use-is-mobile.ts` (SSR-safe: `false` en server y primer render, sincroniza en `useEffect`, escucha `change`; sin `as`):

```ts
"use client"

import { useEffect, useState } from "react"
import { MOBILE_BREAKPOINT } from "@/constants/responsive.constants"

// Devuelve true cuando el viewport es < MOBILE_BREAKPOINT. SSR-safe: false en el
// server y en el primer render del cliente (evita mismatch de hidratación), se
// sincroniza tras montar y ante cambios de tamaño.
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(mql.matches)
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
```

- [ ] **Step 3: Verificar**

Run: `pnpm typecheck && pnpm lint`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/constants/responsive.constants.ts src/hooks/use-is-mobile.ts
git commit -m "feat(responsive): useIsMobile hook + MOBILE_BREAKPOINT"
```

---

### Task 2: `export const viewport` en el layout raíz

**Files:**
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: nada. Produces: meta viewport controlado en toda la app.

- [ ] **Step 1: Leer los docs de Next sobre `viewport`**

Run: `ls node_modules/next/dist/docs 2>/dev/null && grep -rl "viewport" node_modules/next/dist/docs 2>/dev/null | head`
Confirmar la forma del export `viewport` y el tipo `Viewport` antes de escribir.

- [ ] **Step 2: Añadir el export**

En `src/app/layout.tsx`, ampliar el import de tipos y añadir el export tras `metadata` (no fijar `maximumScale` — preservar zoom/accesibilidad):

```tsx
import type { Metadata, Viewport } from "next"
```

```tsx
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}
```

- [ ] **Step 3: Verificar y commit**

Run: `pnpm typecheck && pnpm build`
Expected: build verde; el `<head>` incluye `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.

```bash
git add src/app/layout.tsx
git commit -m "feat(responsive): viewport export (device-width + viewport-fit cover)"
```

---

### Task 3: Componente `Sheet` (drawer lateral sobre base-ui `Dialog`)

**Files:**
- Create: `src/components/ui/sheet.tsx`

**Interfaces:**
- Produces: `Sheet` (Root), `SheetContent` (panel lateral izquierdo, prop `open`/`onOpenChange` vía Root), reusando los data-slots del patrón de `dialog.tsx`. Consumido por `AppShell` (Task 5).

- [ ] **Step 1: Crear el Sheet**

`src/components/ui/sheet.tsx` — reusa `DialogPrimitive` de base-ui (mismo import que `dialog.tsx`), backdrop con blur, panel anclado a la izquierda con slide-in. Componente vendored de UI → se permite `function` (excepción de la regla 1):

```tsx
"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetContent({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal data-slot="sheet-portal">
      <DialogPrimitive.Backdrop
        data-slot="sheet-overlay"
        className="fixed inset-0 z-50 bg-black/30 duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
      />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-card ring-1 ring-foreground/10 duration-150 outline-none data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

export { Sheet, SheetContent, SheetTrigger }
```

- [ ] **Step 2: Verificar y commit**

Run: `pnpm typecheck && pnpm lint`
Expected: sin errores (`slide-in-from-left`/`slide-out-to-left` vienen de `tw-animate-css`, ya importado en `globals.css`; si el linter de Tailwind marcara la clase, usar la utilidad equivalente disponible).

```bash
git add src/components/ui/sheet.tsx
git commit -m "feat(ui): Sheet (drawer lateral) sobre base-ui Dialog"
```

---

### Task 4: Extraer `<AppNav>` (render de `NAV` compartido)

**Files:**
- Create: `src/app/(app)/(sections)/app.nav.tsx`
- Modify: `src/app/(app)/(sections)/app.sidebar.tsx`

**Interfaces:**
- Consumes: `NAV` (`@/constants/navegacion.constants`), `itemVisible` (`@/utils/permisos.utils`), `cn`.
- Produces: `AppNav` con props `{ role: string; permissions: readonly string[]; onNavigate?: () => void }`. `onNavigate` se llama al hacer clic en un `<Link>` (para que el drawer se cierre). Consumido por `AppSidebar` (desktop) y `AppShell` (drawer).

- [ ] **Step 1: Crear `app.nav.tsx`**

Mueve el render de `NAV` (hoy en `app.sidebar.tsx:31-81`) a un componente propio. Ítems táctiles cómodos en móvil (`py-2`), llama `onNavigate` al navegar:

```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV } from "@/constants/navegacion.constants"
import { cn } from "@/lib/utils"
import { itemVisible } from "@/utils/permisos.utils"

type Props = {
  role: string
  permissions: readonly string[]
  onNavigate?: () => void
}

export const AppNav = ({ role, permissions, onNavigate }: Props) => {
  const pathname = usePathname()
  const usuario = { role, permissions }
  return (
    <nav className="flex-1 overflow-y-auto p-2">
      {NAV.map((seccion) => {
        const items = seccion.items.filter((item) => itemVisible(usuario, item))
        if (items.length === 0) return null
        return (
          <div key={seccion.section} className="mb-3">
            <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {seccion.section}
            </p>
            <ul className="flex flex-col gap-0.5">
              {items.map((item) => {
                const Icon = item.icon
                if (!item.disponible) {
                  return (
                    <li key={item.id}>
                      <span
                        className="flex cursor-not-allowed items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground/50"
                        title="Disponible próximamente"
                      >
                        <Icon className="size-4" />
                        {item.label}
                      </span>
                    </li>
                  )
                }
                const activo =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        activo &&
                          "bg-accent font-medium text-accent-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: Adelgazar `app.sidebar.tsx` para que use `<AppNav>`**

Reemplazar el contenido de `app.sidebar.tsx` por (el `<aside>` conserva su cabecera con el logo y ahora delega la navegación en `<AppNav>`; el `hidden md:flex` se aplicará en Task 5 desde el shell, o aquí directamente):

```tsx
"use client"

import Image from "next/image"
import { AppNav } from "./app.nav"

type Props = { role: string; permissions: readonly string[] }

export const AppSidebar = ({ role, permissions }: Props) => (
  <aside className="hidden w-60 shrink-0 flex-col border-r bg-card md:flex">
    <div className="flex h-14 items-center gap-2 border-b px-4">
      <Image
        src="/logo-la-cabana.png"
        alt="La Cabaña Forestal"
        width={36}
        height={36}
        className="h-9 w-9 shrink-0"
        priority
      />
      <div className="leading-tight">
        <p className="text-sm font-semibold">SCI</p>
        <p className="text-xs text-muted-foreground">La Cabaña Forestal</p>
      </div>
    </div>
    <AppNav role={role} permissions={permissions} />
  </aside>
)
```

- [ ] **Step 3: Verificar y commit**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: build verde; el sidebar se ve igual en desktop (`≥ md`) y desaparece en `< md` (se restaura vía drawer en Task 5).

```bash
git add "src/app/(app)/(sections)/app.nav.tsx" "src/app/(app)/(sections)/app.sidebar.tsx"
git commit -m "refactor(shell): extraer AppNav; sidebar hidden en < md"
```

---

### Task 5: `<AppShell>` con hamburguesa + drawer, y cablearlo en el layout

**Files:**
- Create: `src/app/(app)/(sections)/app.shell.tsx`
- Modify: `src/app/(app)/(sections)/app.topbar.tsx`
- Modify: `src/app/(app)/layout.tsx`

**Interfaces:**
- Consumes: `AppSidebar`, `AppNav`, `AppTopbar`, `Sheet`/`SheetContent` (Task 3), `useIsMobile` no es necesario aquí (el drawer se oculta con CSS `md:hidden`; el shell solo gestiona `open`).
- Produces: `AppShell` con props `{ usuario: { nombre: string; email: string; role: string; permissions: readonly string[] } }`. `AppTopbar` gana prop `onOpenMenu?: () => void`.

- [ ] **Step 1: Añadir la hamburguesa a `AppTopbar`**

En `app.topbar.tsx`: añadir prop `onOpenMenu`, importar `Menu` de `lucide-react`, y cambiar el `<header>` a `justify-between` con el botón hamburguesa a la izquierda (visible solo `< md`):

```tsx
import { ChevronDown, KeyRound, LogOut, Menu } from "lucide-react"
```

```tsx
type Props = {
  nombre: string
  email: string
  role: string
  onOpenMenu?: () => void
}
```

```tsx
  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenMenu}
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </Button>
      <div className="ml-auto">
        <DropdownMenu>
          {/* …contenido del dropdown de usuario existente, sin cambios… */}
        </DropdownMenu>
      </div>
    </header>
  )
```

(El resto del componente —`useRouter`, `cerrarSesion`, el `DropdownMenu`— se conserva; solo se envuelve el dropdown en `<div className="ml-auto">` y se añade el botón.)

- [ ] **Step 2: Crear `app.shell.tsx`**

Client component: mantiene `open`, cierra el drawer al navegar (`usePathname`), compone sidebar fijo + topbar + `<main>` + drawer:

```tsx
"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { AppNav } from "./app.nav"
import { AppSidebar } from "./app.sidebar"
import { AppTopbar } from "./app.topbar"

type Usuario = {
  nombre: string
  email: string
  role: string
  permissions: readonly string[]
}

export const AppShell = ({
  usuario,
  children,
}: {
  usuario: Usuario
  children: React.ReactNode
}) => {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <div className="flex min-h-screen">
      <AppSidebar role={usuario.role} permissions={usuario.permissions} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar
          nombre={usuario.nombre}
          email={usuario.email}
          role={usuario.role}
          onOpenMenu={() => setOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="md:hidden">
          <div className="flex h-14 items-center gap-2 border-b px-4">
            <p className="text-sm font-semibold">SCI</p>
            <p className="text-xs text-muted-foreground">La Cabaña Forestal</p>
          </div>
          <AppNav
            role={usuario.role}
            permissions={usuario.permissions}
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
```

- [ ] **Step 3: Cablear `AppShell` en `(app)/layout.tsx`**

`src/app/(app)/layout.tsx` (server) pasa a delegar todo el shell:

```tsx
import { requireAuth } from "@/server/auth/auth.queries"
import { AppShell } from "./(sections)/app.shell"

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  const usuario = await requireAuth()
  return (
    <AppShell
      usuario={{
        nombre: usuario.nombre,
        email: usuario.email,
        role: usuario.role,
        permissions: usuario.permissions,
      }}
    >
      {children}
    </AppShell>
  )
}

export default AppLayout
```

(Verificar la forma exacta de `requireAuth()` en `src/server/auth/auth.queries.ts` y ajustar el mapeo si algún campo difiere; no usar `as`.)

- [ ] **Step 4: Verificar y commit**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: build verde.

```bash
git add "src/app/(app)/(sections)/app.shell.tsx" "src/app/(app)/(sections)/app.topbar.tsx" "src/app/(app)/layout.tsx"
git commit -m "feat(shell): AppShell con drawer + hamburguesa en móvil"
```

---

### Task 6: Arreglos de desborde en toolbar, paginación y tabs

**Files:**
- Modify: `src/components/ui/data-table-toolbar.tsx:48`
- Modify: `src/components/ui/data-table-pagination.tsx:69`
- Modify: `src/app/(app)/cuaderno/(sections)/cuaderno.tabs.tsx:11`
- Modify: `src/app/(app)/terreno/(sections)/terreno.tabs.tsx` (misma línea del `<nav>`)
- Modify: barra de sub-tabs de fertirriego (buscar el `<nav>` equivalente bajo `cuaderno/fertirriego/(sections)/`)

**Interfaces:** solo cambios de className; sin cambios de API.

- [ ] **Step 1: Buscador de toolbar full-width en móvil**

En `data-table-toolbar.tsx`, el `Input` (línea ~48): `className="w-72"` → `className="w-full sm:w-72"`.

- [ ] **Step 2: Fila de paginación que no desborde**

En `data-table-pagination.tsx`, la fila de botones (línea ~69): `className="flex items-center gap-1"` → `className="flex flex-wrap items-center gap-1"`.

- [ ] **Step 3: Tabs con scroll horizontal**

En `cuaderno.tabs.tsx` (línea 11) y `terreno.tabs.tsx`: `className="flex gap-1 border-b"` → `className="flex gap-1 overflow-x-auto whitespace-nowrap border-b"`. Aplicar el mismo cambio a la barra de sub-tabs de fertirriego.

- [ ] **Step 4: Verificar y commit**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: build verde.

```bash
git add src/components/ui/data-table-toolbar.tsx src/components/ui/data-table-pagination.tsx "src/app/(app)/cuaderno" "src/app/(app)/terreno"
git commit -m "fix(responsive): buscador full-width, paginación flex-wrap, tabs con scroll"
```

---

### Task 7: Verificación manual responsive + HANDOFF

**Files:**
- Modify: `docs/HANDOFF.md` (marcar 13a HECHO tras verificar)

- [ ] **Step 1: Levantar la app**

Run: `pnpm dev` (con `DATABASE_URL` seteada). Abrir en DevTools responsive.

- [ ] **Step 2: Checklist manual (375px iPhone SE y ~768px, tema claro y oscuro)**

- [ ] A `< md`: aparece la hamburguesa; el sidebar fijo no ocupa espacio.
- [ ] Tocar la hamburguesa abre el drawer (slide desde la izquierda) con backdrop; tocar fuera lo cierra.
- [ ] Navegar desde el drawer cierra el drawer y cambia de página.
- [ ] A `≥ md`: sidebar fijo visible; sin hamburguesa; app idéntica a hoy.
- [ ] En una tabla (`/productos`): el buscador ocupa todo el ancho en móvil; la paginación envuelve sin desbordar.
- [ ] En `/cuaderno` y `/terreno`: la barra de tabs hace scroll horizontal en móvil.
- [ ] El `body` no tiene scroll horizontal en ninguna vista.

- [ ] **Step 3: Verificación automática final**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: 298 tests verdes; build verde.

- [ ] **Step 4: Actualizar HANDOFF y abrir PR**

Marcar en la tabla "Estado por fase" la fila 13a como `HECHO`, actualizar "Rama activa"/"Última actualización", añadir fila en la bitácora. Commit y push; abrir PR de `feat/fase-13a-responsive` → `develop`.

```bash
git add docs/HANDOFF.md
git commit -m "docs(handoff): Fase 13a (fundaciones responsive + drawer) HECHA"
git push -u origin feat/fase-13a-responsive
```

---

## Self-Review

- **Cobertura del spec (13a)**: viewport (Task 2) ✓ · `useIsMobile` + breakpoint (Task 1) ✓ · Sheet/drawer (Task 3) ✓ · `<AppNav>` compartido (Task 4) ✓ · `<AppShell>` + hamburguesa (Task 5) ✓ · arreglos toolbar/paginación/tabs (Task 6) ✓ · ergonomía táctil = `py-2` en nav del drawer + `size="icon"` de la hamburguesa (Task 4/5). No se cambia el tamaño global de `Button` (decisión del ADR-019).
- **Sin placeholders**: cada paso trae el código o el className exacto.
- **Consistencia de tipos**: `AppNav` props `{ role, permissions, onNavigate? }` idénticas en Task 4 y su uso en Task 5; `AppTopbar` gana `onOpenMenu?`; `AppShell` recibe `usuario` con los 4 campos que `requireAuth()` ya expone (verificar en Step 3 de Task 5).
- **Nota**: `useIsMobile` (Task 1) no se consume en 13a (el drawer se resuelve con CSS `md:hidden`); se introduce aquí porque 13b lo necesita para la vista card. Es intencional.
