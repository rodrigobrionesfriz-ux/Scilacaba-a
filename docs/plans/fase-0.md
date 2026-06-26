# Fase 0 — Scaffold + Tooling — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Levantar el esqueleto de SCI v2 — Next.js + TS + Tailwind con estructura screaming-modular (`src/modules` + `src/shared`), tooling completo (shadcn, ESLint con boundaries, Prettier, Drizzle, Vitest, Playwright) y CI verde en PR a `develop`.

**Architecture:** Screaming Architecture modular (ADR-006). `app/` (raíz) es routing fino que delega en módulos vía su `index.ts`; `src/modules/<m>/{domain,data,actions,ui,index.ts}` son vertical slices; `src/shared/` es el kernel transversal (db, ui, utils...). Regla de dependencias `app → modules (vía index.ts) → shared`, **vigilada por `eslint-plugin-boundaries`**. Un módulo no importa internals de otro.

**Tech Stack:** Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind v4 + shadcn/ui · ESLint flat config (`eslint-config-next` + `eslint-plugin-boundaries`) · Prettier · Drizzle ORM 0.45 + drizzle-kit 0.31 (postgres-js) · Vitest 4 · Playwright 1.61 · GitHub Actions.

## Global Constraints

- **No modificar `index.html`** — es la referencia viva de funcionalidad (ADR-002). No tocar `docs/` salvo `HANDOFF.md` y este plan.
- **Estructura de carpetas fija:** `app/` en la raíz (NO `src/app`); módulos en `src/modules/<m>`; kernel en `src/shared`. Alias `@/*` → `./src/*`.
- **Regla de boundaries:** `app` solo importa el `index.ts` de un módulo; un módulo importa `shared` y sus propios archivos, nunca internals de otro módulo; `shared` solo importa `shared`. Verificada en lint.
- **Package manager:** pnpm (preferencia del usuario). Node 24. `packageManager: pnpm@11.1.2` pineado en `package.json`. Builds de deps con scripts (`sharp`, `unrs-resolver`, `@tailwindcss/oxide`) habilitados vía `allowBuilds` en `pnpm-workspace.yaml` (pnpm 11 ignora scripts de lifecycle por defecto y ya NO lee config del campo `pnpm` de package.json).
- **Commits:** convencionales `feat(scope): ...`. **NUNCA incluir `Co-Authored-By`** en los commits.
- **Fase 0 NO usa Railway ni datos reales.** `DATABASE_URL` real es Fase 1. Para Fase 0 basta un Postgres efímero (servicio en CI) y un schema *placeholder* (`_health`) que se elimina en Fase 1.
- **Éxito:** `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm typecheck`, `pnpm lint` en verde local + **CI verde** en el PR a `develop`.

## File Structure

```
.
├── app/
│   ├── layout.tsx              # root layout, importa globals.css
│   ├── page.tsx                # delega en @/modules/dashboard (DashboardPage)
│   └── globals.css             # @import "tailwindcss"
├── src/
│   ├── modules/
│   │   └── dashboard/
│   │       ├── ui/dashboard-page.tsx   # placeholder UI (usa shared/ui Button)
│   │       └── index.ts                # public entry: export { DashboardPage }
│   └── shared/
│       ├── db/
│       │   ├── client.ts        # drizzle(postgres(DATABASE_URL))
│       │   └── schema.ts        # placeholder: tabla _health (se borra en Fase 1)
│       ├── ui/
│       │   └── button.tsx       # shadcn Button
│       └── utils/
│           ├── cn.ts            # shadcn cn() helper
│           ├── money.ts         # formatCLP() — util de dominio, testeada
│           └── money.test.ts    # test Vitest verde
├── e2e/
│   └── dashboard.spec.ts        # Playwright: '/' renderiza el dashboard
├── drizzle/                     # output de migraciones (generado)
├── .github/workflows/ci.yml     # typecheck + lint + test + build + db:migrate (PR→develop)
├── drizzle.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── eslint.config.mjs            # next + boundaries
├── .prettierrc.json
├── components.json              # shadcn (aliases → @/shared)
├── .env.example                 # DATABASE_URL
├── tsconfig.json                # paths @/* → ./src/*
└── package.json                 # scripts dev/build/start/lint/typecheck/test/e2e/db:*/format
```

---

## Task 1: Scaffold Next.js (TS + Tailwind + ESLint + App Router) en la raíz

`create-next-app` aborta si el directorio tiene archivos en conflicto (`index.html` no está en su allowlist). Solución: generar en un directorio temporal y copiar al repo sin pisar `index.html`/`docs/`/`.git`.

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `postcss.config.mjs`, `eslint.config.mjs`, `.gitignore`, `next-env.d.ts`, `AGENTS.md` (todos generados por create-next-app)
- Keep untouched: `index.html`, `docs/`, `README.md`

- [ ] **Step 1: Generar Next.js 16 en un tmp dir (no interactivo)**

```bash
cd <scratchpad>
pnpm dlx create-next-app@latest sci-scaffold --yes --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-pnpm
```
Expected: proyecto generado en `<scratchpad>/sci-scaffold` (App Router en raíz, sin `src/`).

- [ ] **Step 2: Copiar al repo sin pisar index.html / docs / .git**

```bash
cd <scratchpad>/sci-scaffold
rm -rf .git node_modules .next
rsync -a --exclude '.git' --exclude 'README.md' ./ /home/berserk/projects/Scilacaba-a/
```
(Se copian solo los fuentes; las deps se instalan con `pnpm install` en el repo, NO se copia `node_modules`.) Verificar que `index.html`, `docs/`, `README.md` siguen intactos: `cd /home/berserk/projects/Scilacaba-a && git status` debe mostrar solo archivos nuevos de Next, nunca `modified: index.html`.

- [ ] **Step 3: tsconfig paths → ./src/***

En `tsconfig.json`, fijar el alias para que `@/*` resuelva a `src/` (create-next-app sin `--src-dir` lo deja en `./*`):
```json
"paths": { "@/*": ["./src/*"] }
```

- [ ] **Step 4: Instalar deps con pnpm + habilitar builds**

```bash
cd /home/berserk/projects/Scilacaba-a
pnpm install
```
Next 16 corre un chequeo de deps antes de `build` que invoca `pnpm install`; pnpm 11 bloquea los scripts de lifecycle por defecto y sale con error. Añadir `packageManager: "pnpm@11.1.2"` a `package.json` y crear/editar `pnpm-workspace.yaml`:
```yaml
allowBuilds:
  sharp: true
  unrs-resolver: true
  "@tailwindcss/oxide": true
```
Luego `rm -rf node_modules && pnpm install` para que se ejecuten los builds.

- [ ] **Step 5: Verificar dev y build**

```bash
pnpm build
```
Expected: build OK (la home por defecto de Next compila). `pnpm dev` levanta en :3000.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(scaffold): bootstrap Next.js 16 + TS + Tailwind (App Router en raíz) con pnpm"
```

---

## Task 2: Estructura modular + módulo `dashboard` de ejemplo

Demuestra el flujo `app/page.tsx → @/modules/dashboard (index.ts) → shared`.

**Files:**
- Create: `src/modules/dashboard/ui/dashboard-page.tsx`, `src/modules/dashboard/index.ts`
- Modify: `app/page.tsx`

**Interfaces:**
- Produces: `DashboardPage` (React Server Component, sin props) exportado desde `@/modules/dashboard`.

- [ ] **Step 1: UI del módulo**

`src/modules/dashboard/ui/dashboard-page.tsx`:
```tsx
export function DashboardPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">SCI v2 — Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Placeholder. Fase 0: scaffold + tooling.
      </p>
    </main>
  );
}
```

- [ ] **Step 2: Public entry (index.ts)**

`src/modules/dashboard/index.ts`:
```ts
export { DashboardPage } from "./ui/dashboard-page";
```

- [ ] **Step 3: app/page.tsx delega en el módulo**

`app/page.tsx` (reemplazar contenido generado):
```tsx
import { DashboardPage } from "@/modules/dashboard";

export default function Page() {
  return <DashboardPage />;
}
```

- [ ] **Step 4: Verificar build + typecheck**

```bash
pnpm build
pnpm exec tsc --noEmit
```
Expected: ambos OK; `/` renderiza el dashboard placeholder.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(dashboard): módulo de ejemplo wired app→module→shared"
```

---

## Task 3: shadcn/ui init + Button en `src/shared/ui`

**Files:**
- Create: `components.json`, `src/shared/ui/button.tsx`, `src/shared/utils/cn.ts`
- Modify: `src/modules/dashboard/ui/dashboard-page.tsx` (usar Button), `app/globals.css` (tokens shadcn)

- [ ] **Step 1: Inicializar shadcn con defaults**

```bash
pnpm dlx shadcn@latest init -d
```
Si pregunta, aceptar defaults (base color neutral, CSS variables). Esto crea `components.json` y el helper `cn`.

- [ ] **Step 2: Reapuntar aliases de shadcn a `@/shared`**

Editar `components.json` para que los componentes vivan en el kernel (ADR-012):
```json
{
  "aliases": {
    "components": "@/shared",
    "ui": "@/shared/ui",
    "utils": "@/shared/utils/cn",
    "lib": "@/shared",
    "hooks": "@/shared/hooks"
  }
}
```
Mover el helper generado a `src/shared/utils/cn.ts` si shadcn lo dejó en otro lugar (`export function cn(...)`).

- [ ] **Step 3: Añadir Button**

```bash
pnpm dlx shadcn@latest add button
```
Expected: `src/shared/ui/button.tsx` creado.

- [ ] **Step 4: Usar Button en el dashboard (prueba el wiring a shared)**

En `dashboard-page.tsx` añadir:
```tsx
import { Button } from "@/shared/ui/button";
// ...dentro del main:
<Button className="mt-4">OK</Button>
```

- [ ] **Step 5: Verificar build**

```bash
pnpm build
```
Expected: OK; el botón shadcn renderiza con estilos.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ui): shadcn/ui init + Button en src/shared/ui"
```

---

## Task 4: ESLint boundaries + Prettier

Enforce `app → modules (index) → shared` y prohíbe internals cruzados.

**Files:**
- Modify: `eslint.config.mjs`, `package.json` (devDeps + scripts)
- Create: `.prettierrc.json`, `.prettierignore`

- [ ] **Step 1: Instalar deps**

```bash
pnpm add -D eslint-plugin-boundaries prettier eslint-config-prettier
```

- [ ] **Step 2: Configurar boundaries en `eslint.config.mjs`**

Añadir a la config flat (junto a la de Next). `settings` define los elementos y `rules` las restricciones:
```js
import boundaries from "eslint-plugin-boundaries";

// ...dentro del array de config, añadir un bloque:
{
  files: ["app/**", "src/**"],
  plugins: { boundaries },
  settings: {
    "boundaries/elements": [
      { type: "app", pattern: "app", mode: "folder" },
      { type: "module", pattern: "src/modules/*", mode: "folder", capture: ["mod"] },
      { type: "shared", pattern: "src/shared", mode: "folder" },
    ],
  },
  rules: {
    "boundaries/element-types": ["error", {
      default: "disallow",
      rules: [
        { from: "app", allow: ["module", "shared"] },
        { from: "module", allow: ["shared", ["module", { mod: "${from.mod}" }]] },
        { from: "shared", allow: ["shared"] },
      ],
    }],
    "boundaries/entry-point": ["error", {
      default: "disallow",
      rules: [
        { target: ["module"], allow: "index.ts" },
        { target: ["shared"], allow: "**" },
      ],
    }],
  },
},
```
Añadir también `eslint-config-prettier` al final del array para desactivar reglas de formato que choquen con Prettier.

- [ ] **Step 3: Prettier config**

`.prettierrc.json`:
```json
{ "semi": true, "singleQuote": false, "trailingComma": "all", "printWidth": 100 }
```
`.prettierignore`:
```
.next
node_modules
drizzle
index.html
```

- [ ] **Step 4: Scripts en package.json**

```json
"lint": "eslint .",
"typecheck": "tsc --noEmit",
"format": "prettier --write .",
"format:check": "prettier --check ."
```

- [ ] **Step 5: Verificar lint verde y que la regla MUERDE**

```bash
pnpm lint
```
Expected: PASS sobre el código actual (app importa solo el index del módulo).
Prueba negativa (no commitear): crear `src/modules/dashboard/ui/leak.ts` con `import { foo } from "@/modules/otro/ui/secreto"` o hacer que `app/page.tsx` importe `@/modules/dashboard/ui/dashboard-page` (internal, no el index) → `pnpm lint` debe FALLAR con error de `boundaries/entry-point` o `boundaries/element-types`. Revertir la prueba.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(lint): ESLint boundaries (app→module→shared) + Prettier"
```

---

## Task 5: Drizzle + drizzle-kit + client + schema placeholder + .env.example

**Files:**
- Create: `drizzle.config.ts`, `src/shared/db/schema.ts`, `src/shared/db/client.ts`, `.env.example`
- Modify: `package.json` (deps + scripts db:*), `.gitignore` (`.env`)

**Interfaces:**
- Produces: `db` (drizzle instance) desde `@/shared/db/client`; tabla `health` desde `@/shared/db/schema`.

- [ ] **Step 1: Instalar deps**

```bash
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit dotenv
```

- [ ] **Step 2: Schema placeholder**

`src/shared/db/schema.ts`:
```ts
import { pgTable, serial, timestamp } from "drizzle-orm/pg-core";

// PLACEHOLDER de Fase 0: prueba el pipeline de migraciones.
// Se reemplaza por el schema real en Fase 1.
export const health = pgTable("_health", {
  id: serial("id").primaryKey(),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
});
```

- [ ] **Step 3: Client**

`src/shared/db/client.ts`:
```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL no está definida");
}

const client = postgres(connectionString, { max: 1 });
export const db = drizzle(client, { schema });
```

- [ ] **Step 4: drizzle.config.ts**

```ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/shared/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

- [ ] **Step 5: .env.example + .gitignore**

`.env.example`:
```
# Fase 0: Postgres local/efímero basta. DATABASE_URL real (Railway) es Fase 1.
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sci"
```
Añadir `.env` a `.gitignore` (create-next-app ya ignora `.env*`; verificar).

- [ ] **Step 6: Scripts db:* en package.json**

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:push": "drizzle-kit push"
```

- [ ] **Step 7: Verificar el pipeline contra un Postgres efímero (Docker)**

```bash
docker run --rm -d --name sci-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sci -p 5432:5432 postgres:16
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sci"
sleep 4
pnpm db:generate   # genera drizzle/0000_*.sql para _health
pnpm db:migrate    # aplica la migración → OK
docker stop sci-pg
```
Expected: `db:generate` crea un SQL en `drizzle/`; `db:migrate` aplica sin error. (Si no hay Docker local, se valida en CI — Task 7.)

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(db): Drizzle + drizzle-kit + client + schema placeholder _health + .env.example"
```

---

## Task 6: Vitest con un test verde (util de dominio)

**Files:**
- Create: `vitest.config.ts`, `src/shared/utils/money.ts`, `src/shared/utils/money.test.ts`
- Modify: `package.json` (deps + script `test`)

- [ ] **Step 1: Instalar deps**

```bash
pnpm add -D vitest vite-tsconfig-paths
```

- [ ] **Step 2: Escribir el test que falla**

`src/shared/utils/money.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { formatCLP } from "./money";

describe("formatCLP", () => {
  it("formatea pesos chilenos sin decimales", () => {
    expect(formatCLP(1000)).toBe("$1.000");
    expect(formatCLP(2500000)).toBe("$2.500.000");
    expect(formatCLP(0)).toBe("$0");
  });
});
```

- [ ] **Step 3: vitest.config.ts + script**

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
  },
});
```
`package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 4: Correr el test → FALLA (no existe money.ts)**

```bash
pnpm test
```
Expected: FAIL — `Cannot find module './money'` / `formatCLP is not defined`.

- [ ] **Step 5: Implementación mínima**

`src/shared/utils/money.ts`:
```ts
export function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}
```
> Nota: `Intl` en es-CL usa `$` y `.` como separador de miles. Si el runtime de Node no trae el locale es-CL, ajustar a un formateo manual con `toLocaleString` o reemplazo de separadores para garantizar `"$1.000"`.

- [ ] **Step 6: Correr el test → PASA**

```bash
pnpm test
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "test(shared): Vitest verde + formatCLP util"
```

---

## Task 7: Playwright con un e2e verde

**Files:**
- Create: `playwright.config.ts`, `e2e/dashboard.spec.ts`
- Modify: `package.json` (deps + script `e2e`), `vitest.config.ts` (excluir `e2e/`), `.gitignore` (artefactos playwright)

- [ ] **Step 1: Instalar Playwright + navegador**

```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

- [ ] **Step 2: playwright.config.ts**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```
Asegurar script `"start": "next start"` en package.json.

- [ ] **Step 3: e2e test**

`e2e/dashboard.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test("la home renderiza el dashboard placeholder", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /SCI v2 — Dashboard/i }),
  ).toBeVisible();
});
```

- [ ] **Step 4: Aislar Vitest de Playwright**

En `vitest.config.ts` añadir `exclude: ["e2e/**", "node_modules/**"]` para que Vitest no intente correr los specs de Playwright. Añadir `e2e` script: `"e2e": "playwright test"`. Añadir a `.gitignore`: `/test-results`, `/playwright-report`, `/blob-report`, `/playwright/.cache`.

- [ ] **Step 5: Correr e2e (verde)**

```bash
pnpm e2e
```
Expected: 1 passed (Playwright levanta el server, abre `/`, ve el heading).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test(e2e): Playwright verde — home renderiza dashboard"
```

---

## Task 8: GitHub Actions CI (typecheck + lint + test + build + db:migrate) en PR → develop

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Workflow**

`.github/workflows/ci.yml`:
```yaml
name: CI
on:
  pull_request:
    branches: [develop]

jobs:
  verify:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: sci
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready --health-interval 10s
          --health-timeout 5s --health-retries 5
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/sci
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm db:migrate
      - run: pnpm build

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm e2e
```

- [ ] **Step 2: Sanity local del pipeline del job `verify`**

Reproducir la secuencia del job localmente (con el Postgres efímero del Task 5):
```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```
Expected: todo verde. (`db:migrate` ya validado en Task 5 / se ejecutará en CI.)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "ci: typecheck + lint + test + build + db:migrate en PR a develop"
```

---

## Task 9: Actualizar HANDOFF y abrir PR a develop

**Files:**
- Modify: `docs/HANDOFF.md`

- [ ] **Step 1: Actualizar HANDOFF.md**

- Cambiar Fase 0 a `HECHO` en la tabla de estado, con rama `feat/fase-0-scaffold` y el PR.
- "Última actualización" → 2026-06-26, sesión Fase 0.
- "En curso ahora mismo" → resumen de lo entregado.
- "Próximos pasos" → empezar Fase 1 (schema Drizzle real + migrador; export Firebase pendiente).
- Añadir fila a la bitácora de sesiones.
- Resolver/anotar el bloqueo de Railway: sigue pendiente para Fase 1 (Fase 0 usa Postgres efímero en CI).

- [ ] **Step 2: Push + PR**

```bash
git push -u origin feat/fase-0-scaffold
gh pr create --base develop --head feat/fase-0-scaffold \
  --title "feat(fase-0): scaffold + tooling (Next.js, Drizzle, shadcn, CI)" \
  --body-file <(cat <<'EOF'
## Fase 0 — Scaffold + tooling

Esqueleto de SCI v2 según ADR-001/006/012.

### Checklist de entregables
- [x] Next.js 16 + TS + Tailwind, `app/` raíz + `src/modules` + `src/shared`
- [x] Módulo `dashboard` de ejemplo (app/page.tsx → modules/dashboard/index.ts → shared)
- [x] shadcn/ui init + Button en `src/shared/ui`
- [x] ESLint con lint de boundaries (app→module→shared) + Prettier
- [x] Drizzle + drizzle-kit + `drizzle.config.ts` + scripts `db:generate/migrate/push`
- [x] Vitest verde (`formatCLP`)
- [x] Playwright verde (home renderiza dashboard)
- [x] GitHub Actions CI: typecheck + lint + test + build + db:migrate (PR→develop)
- [x] `.env.example` con `DATABASE_URL` + `src/shared/db/client.ts`

### Notas
- Schema `_health` es **placeholder**: se reemplaza por el schema real en Fase 1.
- Railway y datos reales son Fase 1 (Fase 0 usa Postgres efímero en CI).
- `index.html` no se tocó (referencia de funcionalidad).
EOF
)
```

- [ ] **Step 3: Commit final del HANDOFF (si quedó fuera del push)**

```bash
git add docs/HANDOFF.md && git commit -m "docs(handoff): Fase 0 HECHO + bitácora + próximos pasos"
git push
```

---

## Self-Review

**Spec coverage (entregables Fase 0 del prompt):**
- Proyecto Next+TS+Tailwind con `src/modules`+`src/shared` y módulo ejemplo → Tasks 1–2 ✓
- shadcn init; ESLint boundaries + Prettier → Tasks 3–4 ✓
- Drizzle + drizzle-kit + config + scripts → Task 5 ✓
- Vitest y Playwright verdes → Tasks 6–7 ✓
- CI typecheck+lint+test+build en PR→develop → Task 8 ✓ (añade `db:migrate` para probar pipeline DB)
- `.env.example` + `src/shared/db/client.ts` → Task 5 ✓
- HANDOFF + PR con checklist → Task 9 ✓

**Riesgos / puntos de atención:**
- `create-next-app` en dir no vacío: mitigado generando en tmp + rsync excluyendo `index.html`/README/`.git`. Verificar `git status` tras copiar.
- shadcn v4 + alias custom: tras `init -d`, ajustar `components.json` y ubicación de `cn`. Verificar que `pnpm dlx shadcn add button` cae en `src/shared/ui`.
- Boundaries flat-config: validar con prueba negativa (Task 4 Step 5) que la regla efectivamente falla ante un import internal/cross-module.
- `Intl` es-CL en Node: si el locale no produce `"$1.000"`, usar formateo manual (Task 6 Step 5 nota).
- `next build` no debe importar `db/client.ts` (que lanza sin `DATABASE_URL`); en Fase 0 ninguna página lo importa, y CI define `DATABASE_URL`. OK.
