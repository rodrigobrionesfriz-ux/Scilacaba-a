# CONVENCIONES — SCI v2

> **Fuente única de las reglas:** `.claude/rules/` (las carga Claude vía `CLAUDE.md`).
> Este documento es solo un puntero para humanos.

Las 14 reglas de código/estructura del proyecto viven en:

- **`.claude/rules/estilo.md`** — reglas 1–5, 11, 14 (arrow functions con la única excepción de shadcn, `;` solo necesarios, comillas dobles, 1 componente por archivo, archivos cortos, sin `any`/`as`, investigar antes de improvisar).
- **`.claude/rules/estructura.md`** — reglas 6–10, 12, 13 (ubicación por capa: `server`, `constants`, `utils`/`lib`, páginas ≤20 líneas, `(sections)`, `types`, `schemas` zod) + mapa de carpetas.
- **`.claude/rules/boundaries.md`** — dirección de dependencias entre capas (vigilada por `eslint-plugin-boundaries`).

Arquitectura: por capas técnicas (ADR-013, supersede ADR-006). Ver `docs/DECISIONS.md`.
