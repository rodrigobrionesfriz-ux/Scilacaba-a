# CONVENCIONES — SCI v2

Reglas de código y estructura para SCI v2. Son **vinculantes** y mandan sobre cualquier convención previa. La estructura (reglas 6–13) supersede la screaming-modular de ADR-006 (ver **ADR-013** en `DECISIONS.md`).

> Nota: la formalización de estas reglas como lint/skills automáticos se hace en una sesión posterior a Fase 0. Fase 0 ya adopta la **estructura** y el **lint de boundaries** por capas; el resto se escribe siguiendo estas reglas a mano.

## Estilo de código

1. **Siempre arrow functions** (componentes, helpers, handlers). Nada de `function foo()`.
2. **Solo punto y coma necesarios** (estilo ASI; Prettier `semi: false`).
3. **Siempre comillas dobles** (`"..."`; Prettier `singleQuote: false`).
4. **Nunca más de un componente por archivo.**
5. **Nunca archivos demasiado largos** — preferir composición (extraer sub-componentes / helpers).
11. **Nunca `any` ni cast con `as`** — tipar correctamente (usar genéricos, `unknown` + narrowing, o inferencia de zod).
14. **Siempre investigar antes de improvisar** — leer docs/código existente antes de escribir.

## Estructura de carpetas (capas técnicas bajo `src/`)

6. **Server actions y queries** → `src/server/<entidad>/<entidad>.actions.ts` y `src/server/<entidad>/<entidad>.queries.ts`.
7. **Constantes** → `src/constants/<entidad>.constants.ts`. Nunca constantes inline.
8. **Utilidades** → `src/utils/<entidad>.utils.ts`; si la utilidad es común a varios archivos → `src/lib/utils.ts`.
9. **Páginas** = server components, **≤ 20 líneas**, siempre componer (delegar en secciones).
10. **Componentes de cada ruta** → `src/app/<ruta>/(sections)/<ruta>.*.tsx` (p. ej. `src/app/productos/(sections)/productos.form.tsx`).
12. **Tipos** → `src/types/<entidad>.types.ts`.
13. **Schemas de validación (zod)** → `src/schemas/<entidad>.schema.ts`. Toda validación de tipos usa zod.

### Mapa de carpetas

```
src/
  app/<ruta>/page.tsx            # server, ≤20 líneas, compone
  app/<ruta>/(sections)/*.tsx    # componentes de la ruta
  server/<entidad>/*.actions.ts  # mutaciones (Server Actions)
  server/<entidad>/*.queries.ts  # lecturas
  components/ui/                 # componentes compartidos / shadcn
  hooks/                         # hooks compartidos
  lib/utils.ts                   # utilidades comunes (cn, etc.)
  utils/<entidad>.utils.ts       # utilidades por entidad
  types/<entidad>.types.ts       # tipos
  schemas/<entidad>.schema.ts    # zod
  constants/<entidad>.constants.ts
  db/                            # drizzle client + schema
```

## Boundaries (dirección de dependencias)

Vigilado por `eslint-plugin-boundaries` (`boundaries/dependencies`). Las capas de UI no son importadas por capas inferiores; el acceso a datos pasa por `server`:

- `app` → `server`, `components`, `hooks`, `lib`, `utils`, `schemas`, `types`, `constants` (NO `db` directo).
- `components` / `hooks` → `server`, `lib`, `utils`, `schemas`, `types`, `constants`, (peers).
- `server` → `db`, `lib`, `utils`, `schemas`, `types`, `constants` (NO `app`/`components`/`hooks`).
- `db` → `types`, `constants`, `schemas`, `lib`, `utils`.
- `lib` → `utils`, `types`, `constants`, `schemas`. `utils` → `types`, `constants`, `lib`.
- `schemas` → `types`, `constants`. `types` → `constants`. `constants` → (hoja).
