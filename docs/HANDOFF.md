# HANDOFF — SCI v2

> **Este es el PUNTO DE ENTRADA.** Cualquier sesión nueva (humano o agente) empieza leyendo este archivo de principio a fin antes de tocar nada. Se actualiza **cada sesión**.

**Última actualización**: 2026-06-26 por sesión Fase 1 (Claude)
**Rama activa**: `feat/fase-1-schema-migrador` (desde `develop`)
**Estado global**: Fase 1 **EN CURSO**. Schema real (33 tablas) + PPP puro + migrador (slice maestros+inventario) **HECHO y validado contra datos reales** (0 discrepancias de PPP). Falta extender el migrador al resto de dominios.

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
| 0    | Scaffold + tooling + CI (Postgres efímero) | HECHO (merged) | develop (PR #1) | CI verde + local (dev/build/test/typecheck/lint + db:migrate) |
| 1    | Schema Drizzle + migrador + datos reales | EN CURSO | feat/fase-1-schema-migrador | slice maestros+inventario: PPP validado en develop (0 discrepancias) |
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

**Fase 1 en `feat/fase-1-schema-migrador` (desde `develop`).** Lo hecho y verificado:

- **Infra Railway (Hobby)**: proyecto con 2 environments (`develop` y `production`), cada uno con su Postgres independiente. Migración inicial aplicada en ambos (33 tablas, idénticas). App corre local apuntando a la DB `develop` vía `DATABASE_PUBLIC_URL` (en `.env`, gitignored). Deploy de la app → Fase 12.
- **Schema real (33 tablas)**: reemplaza el placeholder `_health`. Dividido por dominio en `src/db/schema/{maestros,inventario,tomas,mantenciones,terreno,cuaderno,fertirriego,presupuesto,sistema}.ts` + barrel `index.ts`. `drizzle.config` apunta al barrel. Migración squasheada a `drizzle/0000_amazing_scream.sql`. Tablas better-auth (`auth_user`, etc.) NO incluidas → Fase 2.
- **PPP puro** (`src/lib/ppp.ts`, ADR-008) + 8 tests: ENT/SAL/TRASPASO, lotes con id determinístico (ADR-009), orden cronológico, anulados, piso en 0. Tipos en `src/types/movimientos.types.ts`, constantes (11 tipos de movimiento + prefijos) en `src/constants/movimientos.constants.ts`.
- **Capa parse/normalize**: zod lenient de los 3 docs (`src/schemas/firestore-{sci,cuaderno,presupuesto}.schema.ts`) + helpers de coerción puros y testeados (`src/utils/migracion.utils.ts`: fechas, numéricos, RUT, booleanos default). **Ojo:** `invplantas.secuencia` resultó ser array de objetos (no strings) en la data real → quedó como `z.array(z.unknown())`.
- **Migrador** en `scripts/migracion/` (corre con `pnpm migrate:data` vía tsx): `firebase.ts` (fetch de los 3 docs vía **SDK web + login anónimo**, config pública en `.env`), `transform.ts` (raw→filas + huérfanos placeholder), `load.ts` (TRUNCATE idempotente + insert en orden de FKs), `recalc.ts` (usa `@/lib/ppp`, reescribe stock+lots), `validate.ts` (prueba dura: stock recalculado == origen ±0.0001), `run.ts` (orquestador).
- **Corrida real contra `develop`** (solo slice maestros+inventario): 176 productos, 14 movimientos, 20 líneas, 14 stock, 7 lotes. **0 discrepancias de PPP.** ✅

Verde local: `pnpm typecheck|lint|test` (23 tests) + `pnpm migrate:data` end-to-end.

Datos reales en origen (para dimensionar lo que falta): cuaderno → panos 19, productos 154; presupuesto → rows 372; sci → audit 1704, invplantas 25, costCenters 14, conteos 5, etc.

---

## Próximos pasos (orden)

1. **Extender el migrador al resto de dominios** (aditivo: amplía `transform`/`load`; el `recalc`/`validate` del PPP ya está):
   - tomas (`inventory_counts` + `inventory_count_lines`) · mantenciones (`maintenance_orders` + lines)
   - terreno (`conteos`, `invplantas`, `estimaciones`) · cuaderno (`panos`, `field_records`, `field_products`, `application_orders`, `application_confirmations`, `fertirriego_*`)
   - presupuesto (`budget_rows` + `budget_meta`) · sistema (`audit`, `config`, **`counters`** sembrados + validación de correlativos)
   - **`migration_log`**: una fila por entidad por corrida (trazabilidad).
2. **Migrar a `production`**: hoy solo se cargó el slice en `develop`. Antes del cutover real, correr la migración completa también contra `production` (cambiar `DATABASE_URL` o parametrizar).
3. **PR de Fase 1 → `develop`** cuando la migración esté completa.

---

## Bloqueos / preguntas abiertas

- ~~**Export de Firebase**~~ — **resuelto**: lo de `index.html` es la **config web pública** (no admin); el migrador lee los 3 docs vía **SDK web + login anónimo** (igual que el monolito). Config en `.env` (gitignored).
- ~~**Railway**~~ — **resuelto**: 2 environments (`develop`/`production`) con Postgres y schema aplicado. Ojo costo Hobby ($5/mes incl.): 2 Postgres ≈ doble consumo, vigilar *Usage*.
- **Usuarios sin password**: el origen usa Firebase anónimo; el migrador inserta `users` de dominio sin credencial. Definir flujo de set-password en primer login (Fase 2, better-auth).
- **Inconsistencias de stock preexistentes**: el slice dio 0 discrepancias, pero al migrar todo conviene revisar si algún `(cod,bod)` difiere — se documentan, no se "arreglan" en silencio (migrator.md).

---

## Bitácora de sesiones

| Fecha | Sesión | Qué se hizo | Commit/PR |
|-------|--------|-------------|-----------|
| 2026-06-25 | bootstrap | Rama `develop` desde `origin/main`; sistema de handoff en `docs/` | (este commit) |
| 2026-06-26 | Fase 0 | Scaffold Next 16 + pnpm; pivot a arquitectura por capas (ADR-013); reglas en `.claude/rules` + skills en `.claude/skills`; shadcn; lint de boundaries; Drizzle (pg) + placeholder `_health`; Vitest; CI; Playwright descartado | PR #1 merged a `develop` (`8eac4e4`) |
| 2026-06-26 | Fase 1 (parcial) | Infra Railway (2 envs develop/production + Postgres); schema real (33 tablas) por dominio + migración squasheada; PPP puro + tests; zod parse/normalize 3 docs + utils coerción; migrador `scripts/migracion` (fetch SDK web+anónimo → transform → load → recalc → validate). Slice maestros+inventario migrado a `develop`: 0 discrepancias de PPP. Falta resto de dominios | `feat/fase-1-schema-migrador` (`f33a88d`, `3ff09cf`) |
