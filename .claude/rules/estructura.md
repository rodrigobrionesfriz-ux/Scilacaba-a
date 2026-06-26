# Reglas de estructura — SCI v2 (arquitectura por capas, ADR-013)

Vinculantes. Organización **por capas técnicas** bajo `src/`. Alias `@/*` → `./src/*`.

6. **Server actions y queries** → `src/server/<entidad>/<entidad>.actions.ts` (mutaciones, `"use server"`) y `src/server/<entidad>/<entidad>.queries.ts` (lecturas). Nunca acceso a datos fuera de `src/server` (o `src/db`).
7. **Constantes** → `src/constants/<entidad>.constants.ts`. **Nunca constantes inline** en componentes/acciones.
8. **Utilidades** → `src/utils/<entidad>.utils.ts`; si es común a varias entidades → `src/lib/utils.ts`.
9. **Páginas** = server components, **≤ 20 líneas**, siempre componer (delegar en una sección). Sin lógica de datos pesada en `page.tsx`.
10. **Componentes de cada ruta** → `src/app/<ruta>/(sections)/<ruta>.*.tsx` (p. ej. `src/app/productos/(sections)/productos.form.tsx`, `productos.table.tsx`).
12. **Tipos** → `src/types/<entidad>.types.ts`.
13. **Schemas de validación (zod)** → `src/schemas/<entidad>.schema.ts`. Toda validación de datos/inputs usa zod.

## Mapa de carpetas

```
src/
  app/<ruta>/page.tsx            # server, ≤20 líneas, compone        (regla 9)
  app/<ruta>/(sections)/*.tsx    # componentes de la ruta             (regla 10)
  server/<entidad>/*.actions.ts  # mutaciones (Server Actions)        (regla 6)
  server/<entidad>/*.queries.ts  # lecturas                           (regla 6)
  components/ui/                 # shadcn (vendored) + UI compartida
  hooks/                         # hooks compartidos
  lib/utils.ts                   # utilidades comunes (cn, ...)        (regla 8)
  utils/<entidad>.utils.ts       # utilidades por entidad             (regla 8)
  types/<entidad>.types.ts       # tipos                              (regla 12)
  schemas/<entidad>.schema.ts    # zod                                (regla 13)
  constants/<entidad>.constants.ts                                    (regla 7)
  db/                            # Drizzle client + schema
```

Patrón de referencia ya en el repo: entidad **dashboard** (`src/app/dashboard/`, `src/server/dashboard/`, `src/types|schemas|constants`).
