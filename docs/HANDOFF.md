# HANDOFF — SCI v2

> **Este es el PUNTO DE ENTRADA.** Cualquier sesión nueva (humano o agente) empieza leyendo este archivo de principio a fin antes de tocar nada. Se actualiza **cada sesión**.

**Última actualización**: 2026-06-27 por sesión Fase 1 (Claude)
**Rama activa**: `feat/fase-1-schema-migrador` (desde `develop`)
**Estado global**: Fase 1 **HECHA y VERIFICADA** contra datos reales. Schema real (33 tablas) + PPP puro + migrador **completo (todos los dominios)**: corrida end-to-end contra `develop` con **0 discrepancias** (PPP, conteos, líneas, huérfanos, correlativos) e **idempotente** (re-correr converge). Falta solo correr la migración contra `production` (pre-cutover) y el PR a `develop`.

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
| 1    | Schema Drizzle + migrador + datos reales | HECHO | feat/fase-1-schema-migrador | migrador completo en develop: 0 discrepancias (PPP+conteos+correlativos), idempotente. Falta correr en production + PR |
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
- **Migrador completo** en `scripts/migracion/` (corre con `pnpm migrate:data` vía tsx): `firebase.ts` (fetch de los 3 docs vía **SDK web + login anónimo**), `transform/` (un módulo por dominio: `sci-maestros`, `sci-inventario`, `sci-tomas`, `sci-mantenciones`, `sci-terreno`, `sci-sistema`, `cuaderno`, `presupuesto` + `index.ts` `transformAll`→`FilasMigracion` con huérfanos), `load.ts` (`loadAll`: TRUNCATE de todas las tablas + insert en orden de FKs), `recalc.ts` (PPP, reescribe stock+lots), `log.ts` (`migration_log`: una fila por entidad por corrida), `validate.ts` (`validarPpp` prueba dura + `validarIntegridad`: conteos, líneas, huérfanos, correlativos, RUT), `run.ts` (orquestador).
- **Counters/correlativos**: sembrados desde `config.counters` (ENT/SAL/TRA/AJU/COMP/TOMA) + `productCounter`→`PRODUCTO`, `cuaderno.oCounter`→`OA`, `fertirriego.oCounter`→`OAF`, reajustados al max real usado. `SERV-*`/`OT-*` son no-correlativos → exentos.
- **Ajustes de schema (esta sesión)**: `invplantas.secuencia` `text[]`→`jsonb` (la data real es heterogénea: string[] en unos registros, object[] en otros → migración `drizzle/0001_abnormal_thanos.sql` con `USING to_jsonb`). Varias columnas jsonb "blob legacy" (arboles, plantas, gps, factura, cfg, productos/distribucion/lineas de cuaderno/fert, prodPct, aportes) pasaron a `$type` laxo (`Record<string,unknown>[]`/`unknown[]`) para preservar el 100% del origen verbatim (SPEC). Solo cambio de SQL: `secuencia`; el resto es compile-time.
- **Corrida real contra `develop` (todos los dominios)**: 176 productos, 14 mov, 20 líneas, 14 stock, 7 lotes, 1 toma, 1 mantención, 19 paños, 25 invplantas, 5 conteos, 372 budget rows, 1707 audit, 9 counters, 5 config. **0 discrepancias** (PPP + integridad) e **idempotente** (re-corrida converge). ✅
  - Nota: `config` baja de 7→5 entradas **por diseño** (counters/productCounter se mueven a la tabla `counters`); excluido del chequeo de pérdida.

Verde local: `pnpm typecheck|lint|test` (27 tests) + `pnpm migrate:data` end-to-end (0 discrepancias).

---

## Próximos pasos (orden)

1. **PR de Fase 1 → `develop`** (migrador completo + ajustes de schema). Incluye la migración `drizzle/0001_abnormal_thanos.sql`.
2. **Migrar a `production`**: hoy la migración completa solo corrió contra `develop`. Antes del cutover real, aplicar `drizzle/0001` y correr `pnpm migrate:data` también contra `production` (apuntar `DATABASE_URL`/`DATABASE_PUBLIC_URL` al env production). Revisar diffs de stock/conteos (esperado: 0).
3. **Fase 2** (better-auth): tablas `auth_*` + flujo set-password para usuarios migrados sin credencial.

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
| 2026-06-27 | Fase 1 (completa) | Migrador extendido a **todos los dominios** (transform por dominio + `transformAll`, `loadAll`, `migration_log`, validación de integridad: conteos/líneas/huérfanos/correlativos/RUT, counters sembrados+reajustados). Ajuste schema `invplantas.secuencia`→jsonb (`0001`) + columnas blob legacy a `$type` laxo verbatim. Corrida end-to-end contra `develop`: **0 discrepancias** e idempotente. 27 tests verdes | `feat/fase-1-schema-migrador` |
