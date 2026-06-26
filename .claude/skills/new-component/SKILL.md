---
name: new-component
description: Use when creating a UI component for a specific route in SCI v2 — to place it in src/app/<ruta>/(sections)/ with the <ruta>.<nombre>.tsx naming and one component per file, rather than inlining it in the page or a shared folder.
---

# Nuevo componente de ruta en SCI v2

Regla 10: los componentes de una ruta viven en `src/app/<ruta>/(sections)/<ruta>.<nombre>.tsx`. Regla 4: **un componente por archivo**.

## Pasos

Para la ruta `<ruta>` y un componente `<nombre>` (p. ej. `form`, `table`, `filtros`):

1. Archivo: `src/app/<ruta>/(sections)/<ruta>.<nombre>.tsx`.
2. Componente arrow, comillas dobles, sin `;` innecesarios:
```tsx
import type { <Tipo> } from "@/types/<entidad>.types"

type <Ruta><Nombre>Props = {
  items: <Tipo>[]
}

export const <Ruta><Nombre> = ({ items }: <Ruta><Nombre>Props) => (
  <table>{/* ... */}</table>
)
```
3. Compón este componente desde la `.view.tsx` de la ruta o desde otra sección.

## Reglas a respetar
- **Un solo componente exportado** por archivo (regla 4). Si aparece un segundo, sácalo a su propio archivo.
- Archivo corto; si crece, extraer sub-secciones (regla 5).
- ¿Es UI compartida entre rutas (no de una ruta concreta)? Va en `src/components/`, no en `(sections)`.
- ¿Necesita estado/efectos de cliente? Añade `"use client"` arriba. Los datos siguen viniendo de `src/server`.
- Verifica `pnpm lint && pnpm typecheck`.
