---
name: new-page
description: Use when creating a new route/page under src/app in SCI v2 — to keep page.tsx a server component of 20 lines or fewer that composes a section, instead of putting markup or data logic in the page.
---

# Nueva página (ruta) en SCI v2

Regla 9: las páginas son **server components, ≤20 líneas, que componen**. La UI real vive en `(sections)/`.

## Pasos

Para la ruta `<ruta>`:

1. `src/app/<ruta>/page.tsx` — server component, arrow, default export, solo compone:
```tsx
import { <Ruta>View } from "./(sections)/<ruta>.view"

const <Ruta>Page = () => <<Ruta>View />

export default <Ruta>Page
```
2. `src/app/<ruta>/(sections)/<ruta>.view.tsx` — la vista (puede ser `async` y llamar queries de `src/server`):
```tsx
export const <Ruta>View = () => (
  <main className="mx-auto max-w-2xl p-8">{/* ... */}</main>
)
```

## Reglas a respetar
- `page.tsx` sin lógica de datos pesada ni markup grande (regla 9).
- Datos → query/action de `src/server` (nunca `src/db` directo desde la UI; ver `.claude/rules/boundaries.md`).
- Si necesitas metadata: `export const metadata = {...}` en `page.tsx` cuenta poco hacia el límite, pero mantén la página mínima.
- Verifica `pnpm lint && pnpm typecheck`.
