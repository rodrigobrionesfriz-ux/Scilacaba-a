# Fase 0 — Scaffold + Tooling — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Levantar el esqueleto de SCI v2 — Next.js + TS + Tailwind con estructura **por capas técnicas** (ADR-013), tooling completo (shadcn, ESLint con boundaries, Prettier, Drizzle, Vitest, Playwright) y CI verde en PR a `develop`.

**Architecture:** Capas técnicas bajo `src/` (ADR-013, supersede la screaming-modular de ADR-006). Detalle de las 14 reglas de código/estructura en `docs/CONVENTIONS.md`. Dirección de dependencias vigilada por `eslint-plugin-boundaries` (`boundaries/dependencies`): la UI no es importada por capas inferiores, el acceso a datos pasa por `server`, las hojas no importan hacia arriba.

**Tech Stack:** Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind v4 + shadcn/ui (base-nova/base-ui) · zod · ESLint flat config (`eslint-config-next` + `eslint-plugin-boundaries`) · Prettier · Drizzle ORM 0.45 + drizzle-kit 0.31 (postgres-js) · Vitest 4 · Playwright 1.61 · GitHub Actions. **pnpm** 11 como package manager.

## Global Constraints

- **No modificar `index.html`** — referencia viva de funcionalidad (ADR-002). No tocar `docs/` salvo `HANDOFF.md`, `CONVENTIONS.md`, `DECISIONS.md`, `SPEC.md` y este plan.
- **Estructura por capas** (ADR-013 / `docs/CONVENTIONS.md`): `src/app/<ruta>/page.tsx` (server, ≤20 líneas) + `(sections)/`; `src/server/<e>/<e>.{actions,queries}.ts`; `src/components/ui`, `src/hooks`; `src/lib/utils.ts` (comunes) y `src/utils/<e>.utils.ts`; `src/types`, `src/schemas` (zod), `src/constants`; `src/db` (Drizzle). Alias `@/*` → `./src/*`.
- **Reglas de código:** arrow functions; solo `;` necesarios (Prettier `semi:false`); comillas dobles; 1 componente por archivo; archivos cortos (componer); nunca `any`/`as`; investigar antes de improvisar. (La formalización como lint/skills es sesión posterior a Fase 0.)
- **Package manager:** pnpm. `packageManager: pnpm@11.1.2`. Builds de deps con scripts habilitados vía `allowBuilds` en `pnpm-workspace.yaml` (pnpm 11 los bloquea por defecto y ya no lee el campo `pnpm` de package.json).
- **Commits:** convencionales `feat(scope): ...`. **NUNCA `Co-Authored-By`**.
- **Fase 0 NO usa Railway ni datos reales.** `DATABASE_URL` real es Fase 1. Postgres efímero (servicio en CI) + schema _placeholder_ (`_health`) que se elimina en Fase 1.
- **Éxito:** `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm typecheck`, `pnpm lint` verdes local + **CI verde** en el PR a `develop`.

## File Structure

```
.
├── src/
│   ├── app/
│   │   ├── layout.tsx · globals.css · favicon.ico
│   │   ├── page.tsx                         # redirect("/dashboard") (server, ≤20 líneas)
│   │   └── dashboard/
│   │       ├── page.tsx                     # compone DashboardView (server, ≤20 líneas)
│   │       └── (sections)/dashboard.view.tsx
│   ├── server/dashboard/dashboard.queries.ts # getDashboardStats() (placeholder)
│   ├── components/ui/button.tsx              # shadcn
│   ├── lib/utils.ts                          # cn()
│   ├── utils/money.utils.ts                  # formatCLP() (+ .test.ts en Vitest)
│   ├── types/dashboard.types.ts              # DashboardStats
│   ├── schemas/dashboard.schema.ts           # zod
│   ├── constants/dashboard.constants.ts
│   └── db/
│       ├── client.ts                         # drizzle(postgres(DATABASE_URL))
│       └── schema.ts                         # placeholder _health (se borra en Fase 1)
├── e2e/dashboard.spec.ts                     # Playwright: /dashboard renderiza
├── drizzle/                                  # output de migraciones
├── .github/workflows/ci.yml
├── drizzle.config.ts · vitest.config.ts · playwright.config.ts
├── eslint.config.mjs · .prettierrc.json · components.json
├── pnpm-workspace.yaml · .env.example · tsconfig.json · package.json
```

---

## Task 1: Scaffold Next.js + pnpm ✅ (hecho)

create-next-app aborta en dir con conflictos (`index.html`). Generar en tmp y copiar.

- [x] `pnpm dlx create-next-app@latest sci-scaffold --yes --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-pnpm` en `<scratchpad>`.
- [x] `rm -rf .git node_modules .next` y `rsync -a --exclude '.git' --exclude 'README.md' ./ <repo>/`. Verificar `git status` no marca `index.html`.
- [x] `tsconfig.json`: `paths { "@/*": ["./src/*"] }`.
- [x] `pnpm install`; pinear `packageManager: "pnpm@11.1.2"`; `pnpm-workspace.yaml` con `allowBuilds: { sharp: true, unrs-resolver: true, "@tailwindcss/oxide": true }`; `rm -rf node_modules && pnpm install`.
- [x] `pnpm build` verde. Commit.

## Task 2: Capa de routing + slice `dashboard` de ejemplo ✅ (hecho)

Demuestra `app → server → {types, schemas, constants, utils, components}` con el lint de boundaries.

- [x] `src/types/dashboard.types.ts`: `export type DashboardStats = { totalProductos: number; totalBodegas: number; valorInventario: number }`.
- [x] `src/schemas/dashboard.schema.ts`: `dashboardStatsSchema` (zod).
- [x] `src/constants/dashboard.constants.ts`: `DASHBOARD_TITLE`, `DASHBOARD_SUBTITLE`.
- [x] `src/server/dashboard/dashboard.queries.ts`: `export const getDashboardStats = async (): Promise<DashboardStats> => dashboardStatsSchema.parse({...0})` (placeholder; Fase 1 leerá de Drizzle).
- [x] `src/utils/money.utils.ts`: `export const formatCLP = (amount: number): string => ...`.
- [x] `src/app/page.tsx`: `const Page = () => { redirect("/dashboard") }; export default Page`.
- [x] `src/app/dashboard/page.tsx`: compone `<DashboardView />` (≤20 líneas).
- [x] `src/app/dashboard/(sections)/dashboard.view.tsx`: server component async que usa `getDashboardStats`, `Button`, constantes y `formatCLP`.
- [x] `pnpm build` + `pnpm typecheck` verdes. Commit.

## Task 3: shadcn/ui ✅ (hecho)

- [x] `pnpm dlx shadcn@latest init -d` (Found Next.js + Tailwind v4; instala `shadcn` como dep porque base-nova importa `shadcn/tailwind.css`).
- [x] `components.json` con aliases por defecto (alineados a las reglas): `ui: @/components/ui`, `utils: @/lib/utils`, `rsc: true`.
- [x] `pnpm dlx shadcn@latest add button` → `src/components/ui/button.tsx` (importa `cn` de `@/lib/utils`). Commit.

## Task 4: ESLint boundaries (por capas) + Prettier ✅ (hecho)

- [x] `pnpm add -D eslint-plugin-boundaries prettier eslint-config-prettier`.
- [x] `eslint.config.mjs`: `settings."boundaries/elements"` define una capa por carpeta (`app, server, components, hooks, db, lib, utils, schemas, types, constants`); regla `boundaries/dependencies` (v6, no deprecada) con `default: "disallow"` y allow-list por capa (ver `docs/CONVENTIONS.md` → Boundaries). `eslint-config-prettier` al final.
- [x] `.prettierrc.json`: `{ "semi": false, "singleQuote": false, "trailingComma": "all", "printWidth": 80 }`; `.prettierignore`.
- [x] Scripts: `lint: "eslint ."`, `typecheck: "tsc --noEmit"`, `format`/`format:check`, `test`/`e2e`/`db:*`.
- [x] Verde + **prueba negativa**: import `server → components` falla con `boundaries/dependencies`. Commit (incluido en el commit del pivot).

## Task 5: Drizzle + drizzle-kit + client + schema placeholder + .env.example

**Files:** Create `drizzle.config.ts`, `src/db/schema.ts`, `src/db/client.ts`, `.env.example`. Modify `package.json` (deps), `.gitignore` (excepción `!.env.example`).

- [ ] **Step 1:** `pnpm add drizzle-orm postgres` && `pnpm add -D drizzle-kit dotenv`.
- [ ] **Step 2:** `src/db/schema.ts` (placeholder, arrow no aplica — es schema):

```ts
import { pgTable, serial, timestamp } from "drizzle-orm/pg-core"

// PLACEHOLDER Fase 0: prueba el pipeline de migraciones. Reemplazado por el schema real en Fase 1.
export const health = pgTable("_health", {
  id: serial("id").primaryKey(),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
})
```

- [ ] **Step 3:** `src/db/client.ts`:

```ts
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("DATABASE_URL no está definida")

const client = postgres(connectionString, { max: 1 })
export const db = drizzle(client, { schema })
```

- [ ] **Step 4:** `drizzle.config.ts`:

```ts
import "dotenv/config"
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
})
```

- [ ] **Step 5:** `.env.example` con `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sci"`; en `.gitignore` añadir `!.env.example` (create-next-app ignora `.env*`).
- [ ] **Step 6:** Verificar contra Postgres efímero (Docker): `docker run --rm -d --name sci-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sci -p 5432:5432 postgres:16`; `export DATABASE_URL=...`; `pnpm db:generate` (crea `drizzle/0000_*.sql`); `pnpm db:migrate` (aplica). `docker stop sci-pg`. Commit.

## Task 6: Vitest con un test verde

**Files:** Create `vitest.config.ts`, `src/utils/money.utils.test.ts`. (`src/utils/money.utils.ts` ya existe — Task 2.)

- [ ] **Step 1:** `pnpm add -D vitest vite-tsconfig-paths`.
- [ ] **Step 2:** `src/utils/money.utils.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { formatCLP } from "./money.utils"

describe("formatCLP", () => {
  it("formatea pesos chilenos sin decimales", () => {
    expect(formatCLP(1000)).toBe("$1.000")
    expect(formatCLP(2500000)).toBe("$2.500.000")
    expect(formatCLP(0)).toBe("$0")
  })
})
```

- [ ] **Step 3:** `vitest.config.ts` con `vite-tsconfig-paths`, `environment: "node"`, `include: ["src/**/*.{test,spec}.ts"]`, `exclude: ["e2e/**", "node_modules/**"]`.
- [ ] **Step 4:** `pnpm test` → verde. Si el locale es-CL de Node no diera `"$1.000"`, ajustar `formatCLP` a formateo manual. Commit.

## Task 7: Playwright con un e2e verde

**Files:** Create `playwright.config.ts`, `e2e/dashboard.spec.ts`. Modify `.gitignore`.

- [ ] **Step 1:** `pnpm add -D @playwright/test` && `pnpm exec playwright install chromium`.
- [ ] **Step 2:** `playwright.config.ts`: `testDir: "./e2e"`, `use.baseURL: "http://localhost:3000"`, `webServer: { command: "pnpm build && pnpm start", url: ..., reuseExistingServer: !process.env.CI, timeout: 120_000 }`.
- [ ] **Step 3:** `e2e/dashboard.spec.ts`: `page.goto("/dashboard")` y `expect(page.getByRole("heading", { name: /SCI v2 — Dashboard/i })).toBeVisible()`.
- [ ] **Step 4:** `.gitignore`: `/test-results`, `/playwright-report`, `/blob-report`, `/playwright/.cache`.
- [ ] **Step 5:** `pnpm e2e` → 1 passed. Commit.

## Task 8: GitHub Actions CI (PR → develop)

**Files:** Create `.github/workflows/ci.yml`.

- [ ] Job `verify` (con servicio `postgres:16`, `env.DATABASE_URL`): `pnpm/action-setup@v4` + `actions/setup-node@v4 {node-version: 24, cache: pnpm}` + `pnpm install --frozen-lockfile` + `pnpm typecheck` + `pnpm lint` + `pnpm test` + `pnpm db:migrate` + `pnpm build`.
- [ ] Job `e2e`: setup pnpm/node + `pnpm install --frozen-lockfile` + `pnpm exec playwright install --with-deps chromium` + `pnpm e2e`.
- [ ] Sanity local: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`. Commit.

## Task 9: Actualizar HANDOFF y abrir PR a develop

- [ ] `docs/HANDOFF.md`: Fase 0 → `HECHO`, rama `feat/fase-0-scaffold` + PR, "Última actualización" 2026-06-26, "En curso", "Próximos pasos" (Fase 1), bitácora. Anotar pivot a ADR-013 y pnpm.
- [ ] `git push -u origin feat/fase-0-scaffold` + `gh pr create --base develop` con checklist de entregables.

---

## Self-Review

**Cobertura de entregables Fase 0:** Next+TS+Tailwind + estructura por capas + slice ejemplo (Tasks 1–2) ✓ · shadcn + ESLint boundaries + Prettier (Tasks 3–4) ✓ · Drizzle + drizzle-kit + config + scripts (Task 5) · Vitest + Playwright verdes (Tasks 6–7) · CI typecheck+lint+test+build (+db:migrate) (Task 8) · `.env.example` + `src/db/client.ts` (Task 5) · HANDOFF + PR (Task 9).

**Desviaciones respecto al prompt original:** (1) pnpm en vez de npm (preferencia del usuario). (2) Arquitectura por capas (ADR-013) en vez de screaming-modular; por tanto el client de DB es `src/db/client.ts` (no `src/shared/db`). Ambas decididas por el usuario durante Fase 0.

**Riesgos:** `Intl` es-CL en Node (fallback manual en `formatCLP`). `next build` no importa `src/db/client.ts` en Fase 0 (no se ejecuta el throw); CI define `DATABASE_URL`. shadcn `Button` quedó como `function` (rule 1 arrow) — vendored; se revisa en la sesión de reglas/skills.
