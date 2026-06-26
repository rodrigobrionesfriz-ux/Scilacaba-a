# Reglas de estilo de código — SCI v2

Vinculantes. Mandan sobre cualquier convención previa. Violar la letra es violar el espíritu.

1. **Siempre arrow functions** — componentes, helpers, handlers, queries, actions. Nada de `function foo() {}`.
   - Componentes: `export const Foo = () => { ... }`. Páginas de Next: `const Page = () => { ... }; export default Page`.
   - **Única excepción:** los componentes _vendored_ de **shadcn/ui** en `src/components/ui/` pueden usar `function` (se generan así y no los reescribimos). Ninguna otra excepción.
2. **Solo punto y coma necesarios** — estilo ASI. Prettier con `"semi": false`. No añadir `;` al final de sentencias.
3. **Siempre comillas dobles** — `"..."`. Prettier `"singleQuote": false`.
4. **Nunca más de un componente por archivo.** Un archivo = un componente exportado (más sus sub-piezas privadas mínimas si son triviales; si crecen, extraer).
5. **Nunca archivos demasiado largos** — preferir composición. Si un archivo crece, extraer sub-componentes a `(sections)/` o helpers a `utils`/`lib`.
11. **Nunca `any` ni cast con `as`** — tipar de verdad: genéricos, `unknown` + narrowing, o inferencia de zod (`z.infer`). (El no-null assertion `!` en scripts de config como `drizzle.config.ts` es tolerado; `as`/`any` no.)
14. **Siempre investigar antes de improvisar** — leer el código/docs existentes (y docs de librerías vía Context7) antes de escribir. No inventar APIs.

> Numeración alineada con las 14 reglas del proyecto (6–10, 12, 13 son de estructura → ver `estructura.md`).
