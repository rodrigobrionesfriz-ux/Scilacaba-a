---
name: sci-conventions
description: Use when writing or editing any TypeScript/React/Next.js code in the SCI v2 repo — components, pages, server actions, queries, types, schemas, constants, utils — to follow the project's 14 rules and layered architecture before producing code.
---

# Convenciones de código SCI v2

Reglas vinculantes del proyecto. Fuente canónica: `.claude/rules/{estilo,estructura,boundaries}.md` (cargadas por `CLAUDE.md`). Esta skill las resume y muestra ejemplos. **Violar la letra es violar el espíritu.**

## Las 14 reglas (resumen)

**Estilo:** (1) arrow functions siempre — única excepción: shadcn vendored en `src/components/ui`; (2) `;` solo necesarios (`semi:false`); (3) comillas dobles; (4) 1 componente por archivo; (5) archivos cortos, componer; (11) nunca `any` ni `as`; (14) investigar antes de improvisar.

**Estructura (capas bajo `src/`):** (6) server actions/queries en `src/server/<e>/<e>.{actions,queries}.ts`; (7) constantes en `src/constants/<e>.constants.ts` (nunca inline); (8) utils en `src/utils/<e>.utils.ts` o comunes en `src/lib/utils.ts`; (9) páginas server, ≤20 líneas, componen; (10) componentes de ruta en `src/app/<ruta>/(sections)/<ruta>.*.tsx`; (12) tipos en `src/types/<e>.types.ts`; (13) zod en `src/schemas/<e>.schema.ts`.

**Boundaries:** UI no es importada por capas inferiores; datos pasan por `src/server`; las hojas (`types/constants/schemas`) no importan hacia arriba. Vigilado por `boundaries/dependencies`.

## Bien / mal

```tsx
// ✅ componente: arrow, comillas dobles, sin ; innecesarios, 1 por archivo
export const ProductoCard = ({ nombre }: ProductoCardProps) => (
  <article className="rounded-lg border p-4">{nombre}</article>
)
```
```ts
// ❌ función declarada, comillas simples, ; , any, constante inline
function productoCard(props: any) {            // ✗ function, any
  const TITULO = 'Producto';                   // ✗ comillas simples, ;, constante inline
}
```
```ts
// ✅ tipo via zod (regla 11/13): inferir, no castear
export const productoSchema = z.object({ codigo: z.string(), precio: z.number() })
export type Producto = z.infer<typeof productoSchema>
```

## Antes de escribir
- ¿Dónde va? Mira la capa (regla 6–13) → `.claude/rules/estructura.md`.
- ¿Importa correcto? → `.claude/rules/boundaries.md`.
- ¿Nuevo CRUD/entidad completo? Usa la skill **new-entity**. ¿Página o componente de ruta? **new-page** / **new-component**.
- Verifica: `pnpm lint && pnpm typecheck`.
