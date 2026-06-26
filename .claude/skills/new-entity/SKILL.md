---
name: new-entity
description: Use when adding a new domain entity or CRUD module to SCI v2 (e.g. productos, bodegas, proveedores, clientes) and you need its full layered slice — server queries/actions, types, zod schema, constants, and route — created consistently.
---

# Scaffold de una entidad (slice por capas)

Crea el esqueleto completo de una entidad `<e>` siguiendo la arquitectura por capas (ADR-013) y las reglas (`.claude/rules/`). REQUIRED: respeta `sci-conventions`.

## Pasos

Para una entidad `<e>` (singular o plural según el dominio; usa el mismo nombre en todos lados, p. ej. `productos`):

1. **Schema (zod)** — `src/schemas/<e>.schema.ts`: define `const <e>Schema = z.object({ ... })`.
2. **Tipo** — `src/types/<e>.types.ts`: `export type <E> = z.infer<typeof <e>Schema>` (importa el schema) o tipo plano si no hay validación.
3. **Constantes** — `src/constants/<e>.constants.ts`: títulos, columnas, opciones. Nunca inline.
4. **Queries** — `src/server/<e>/<e>.queries.ts`: lecturas (arrow, `async`), usan `db` de `@/db/client` + `<e>Schema` para validar salidas.
5. **Actions** — `src/server/<e>/<e>.actions.ts`: cabecera `"use server"`; mutaciones (crear/editar/eliminar), validan input con `<e>Schema`.
6. **Página** — `src/app/<e>/page.tsx`: server component, **≤20 líneas**, compone una sección.
7. **Secciones** — `src/app/<e>/(sections)/<e>.view.tsx` (y `.table.tsx`, `.form.tsx` según haga falta): UI; los datos vienen de las queries de `src/server`.

## Plantilla mínima

```ts
// src/schemas/<e>.schema.ts
import { z } from "zod"
export const <e>Schema = z.object({ id: z.number().int(), nombre: z.string() })
```
```ts
// src/types/<e>.types.ts
import type { z } from "zod"
import type { <e>Schema } from "@/schemas/<e>.schema"
export type <E> = z.infer<typeof <e>Schema>
```
```ts
// src/server/<e>/<e>.queries.ts
import { db } from "@/db/client"
export const get<E> = async () => { /* select con db; validar con <e>Schema */ }
```
```tsx
// src/app/<e>/page.tsx  (≤20 líneas)
import { <E>View } from "./(sections)/<e>.view"
const <E>Page = () => <<E>View />
export default <E>Page
```

## Verificación
- `pnpm lint` (boundaries OK) y `pnpm typecheck` verdes.
- Si tocas el schema de DB, ver la skill/flujo de Drizzle (`pnpm db:generate && pnpm db:migrate`).
