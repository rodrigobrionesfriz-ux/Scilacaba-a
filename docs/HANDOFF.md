# HANDOFF — SCI v2

> **Este es el PUNTO DE ENTRADA.** Cualquier sesión nueva (humano o agente) empieza leyendo este archivo de principio a fin antes de tocar nada. Se actualiza **cada sesión**.

**Última actualización**: 2026-06-26 por sesión Fase 0 (Claude)
**Rama activa**: `feat/fase-0-scaffold` (PR a `develop`)
**Estado global**: Fase 0 (scaffold + tooling) HECHA. Pendiente: merge del PR + Fase 1.

---

## Cómo retomar (léelo primero)

1. `git fetch && git checkout develop && git pull`
2. Si vas a trabajar una fase: `git checkout -b feat/fase-<n>-<modulo>` desde `develop`.
3. Lee `docs/SPEC.md` (qué construimos), `docs/DECISIONS.md` (por qué así), `docs/CONVENTIONS.md` (reglas de código/estructura) y el `docs/modules/<modulo>.md` de lo que toques.
4. Baseline verde antes de tocar (con un Postgres y `DATABASE_URL`): `pnpm install --frozen-lockfile && pnpm db:migrate && pnpm test && pnpm typecheck && pnpm lint && pnpm build`.
5. Mira **"En curso ahora mismo"** y **"Próximos pasos"** abajo.
6. Al terminar la sesión: **actualiza este archivo** (estado, en curso, próximos pasos) y commitea, aunque el trabajo quede a medias. El estado vive en el repo, no en la memoria de la sesión.

---

## Estado por fase

Estados: `PENDIENTE` | `EN CURSO` | `HECHO` (código + tests) | `VERIFICADO` (e2e/manual con evidencia)

| Fase | Módulo / contenido | Estado | Rama / PR | Verificado |
|------|--------------------|--------|-----------|------------|
| —    | Bootstrap (ramas + docs/) | HECHO | develop | sí |
| 0    | Scaffold + tooling + CI (Postgres efímero) | HECHO | feat/fase-0-scaffold (PR a develop) | local (dev/build/test/typecheck/lint + db:migrate) |
| 1    | Schema Drizzle + migrador + datos reales | PENDIENTE | — | — |
| 2    | better-auth + usuarios + permisos + layout/sidebar | PENDIENTE | — | — |
| 3    | Maestros CRUD (productos, bodegas, prov., clientes, centros) | PENDIENTE | — | — |
| 4    | Stock + movimientos + PPP + correlativos | PENDIENTE | — | — |
| 5    | Tomas de inventario | PENDIENTE | — | — |
| 6    | Cuaderno de Campo | PENDIENTE | — | — |
| 7    | Terreno offline (Conteos, Inventario de huerto) + PWA | PENDIENTE | — | — |
| 8    | Mantenciones | PENDIENTE | — | — |
| 9    | Presupuesto + dashboards | PENDIENTE | — | — |
| 10   | Excel/PDF/reportes transversales (consolidación) | PENDIENTE | — | — |
| 11   | Auditoría (UI) + configuración + backup/restore | PENDIENTE | — | — |
| 12   | Deploy Railway + hardening | PENDIENTE | — | — |

---

## Decisiones tomadas (resumen — detalle en DECISIONS.md)

- Stack: Next.js + TS + Server Actions + Postgres + Drizzle (ADR-001).
- Reescritura completa (ADR-002).
- Offline híbrido, solo terreno (ADR-003).
- better-auth con role/permissions en `users` (ADR-004).
- Hosting Railway (ADR-005).
- ~~Screaming Architecture modular (ADR-006)~~ → **Arquitectura por capas técnicas (ADR-013)**; reglas de código/estructura en `docs/CONVENTIONS.md`. Package manager: **pnpm**.
- Git-flow con `develop` (ADR-007).
- PPP en función pura compartida action+migrador (ADR-008).
- IDs determinísticos de lotes para recálculo idempotente (ADR-009).
- Migración desde 3 docs Firestore, no del backup JSON (ADR-010).
- Postgres reafirmado sobre Firestore (ADR-011); shadcn/ui + Tailwind confirmado (ADR-012).
- **Arquitectura por capas técnicas (ADR-013, supersede ADR-006)** + 14 reglas de código en `docs/CONVENTIONS.md`.

---

## En curso ahora mismo

**Fase 0 entregada en `feat/fase-0-scaffold` (PR abierto a `develop`).** Lo hecho:
- Next.js 16 (App Router, Turbopack) + TS + Tailwind v4, **pnpm** (`packageManager` pineado; `allowBuilds` en `pnpm-workspace.yaml`).
- **Arquitectura por capas (ADR-013)**: `src/app` (rutas + `(sections)`), `src/server`, `src/components/ui`, `src/lib`, `src/utils`, `src/types`, `src/schemas`, `src/constants`, `src/db`. Slice `dashboard` de ejemplo (page→view→query→types/schemas/constants/utils/components).
- shadcn/ui (base-nova) + Button. ESLint flat config con **lint de boundaries por capas** (`boundaries/dependencies`) + Prettier (`semi:false`, comillas dobles). Reglas de código en `docs/CONVENTIONS.md`.
- Drizzle + drizzle-kit (driver **pg**), `src/db/{client,schema}.ts`, schema placeholder `_health`, migración `drizzle/0000_*`, `.env.example`.
- Vitest verde (`formatCLP`). **Sin Playwright/e2e** (descartado por el usuario).
- CI (`.github/workflows/ci.yml`): `pnpm install --frozen-lockfile` + typecheck + lint + test + db:migrate + build, con Postgres 16 efímero, en PR a `develop`.

Verde local: `pnpm dev|build|test|typecheck|lint` + `db:generate/migrate` contra Postgres efímero (Docker).

---

## Próximos pasos (orden)

1. **Mergear el PR de Fase 0** a `develop` (revisar CI verde en GitHub).
2. **Sesión de reglas + skills** (pedida por el usuario): formalizar las 14 reglas de `docs/CONVENTIONS.md` como lint automático (arrow functions, `no any`/`no as`, 1 componente por archivo, máximo de líneas, ubicación por capa) y crear skills de apoyo. Revisar también si el `Button` de shadcn (function decl.) se migra a arrow.
3. **Fase 1 — Schema Drizzle real + migrador**: reemplazar el placeholder `_health` por el schema real; conseguir el export de los 3 docs Firestore; provisionar Postgres en Railway y obtener `DATABASE_URL` real; decidir herramienta e2e (Playwright descartado).

---

## Bloqueos / preguntas abiertas

- **Export de Firebase**: confirmar cómo se obtendrá el dump de los 3 docs Firestore (`sci/main`, `cuaderno/main`, `presupuesto/main`) — credenciales firebase-admin o export manual. Necesario para Fase 1.
- **Railway**: el usuario tiene cuenta. Falta crear el proyecto y obtener `DATABASE_URL` real (movido a **Fase 1**; Fase 0 se validó con Postgres efímero en CI/local).
- **Usuarios sin password**: el origen usa Firebase anónimo; definir flujo de set-password en primer login (Fase 2).

---

## Bitácora de sesiones

| Fecha | Sesión | Qué se hizo | Commit/PR |
|-------|--------|-------------|-----------|
| 2026-06-25 | bootstrap | Rama `develop` desde `origin/main`; sistema de handoff en `docs/` | (este commit) |
| 2026-06-26 | Fase 0 | Scaffold Next 16 + pnpm; pivot a arquitectura por capas (ADR-013) + `docs/CONVENTIONS.md`; shadcn; lint de boundaries; Drizzle (pg) + placeholder `_health`; Vitest; CI; Playwright descartado | `feat/fase-0-scaffold` (PR a develop) |
