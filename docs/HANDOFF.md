# HANDOFF — SCI v2

> **Este es el PUNTO DE ENTRADA.** Cualquier sesión nueva (humano o agente) empieza leyendo este archivo de principio a fin antes de tocar nada. Se actualiza **cada sesión**.

**Última actualización**: 2026-06-27 por sesión Fase 5 (Claude)
**Rama activa**: `feat/fase-5-tomas` (desde `develop`)
**Estado global Fase 5**: **HECHO** (código + 11 tests nuevos; verificación e2e/manual por el usuario pendiente). Módulo **Tomas de inventario** completo: iniciar (bodega + filtros grupo/tipo + alcance conStock/todos → snapshot teórico de stock/lotes con PPP congelado), capturar físico, cerrar (pendientes→0 "asumido cero"), autorizar y aplicar (genera 1 TIE consolidado por sobrantes + 1 TIS por faltantes, costo = costoTeorico, tagueados `tomaId`/`tomaNumero`, recálculo PPP en 1 paso), devolver y rechazar. Estados verbatim del monolito (`EN_PROCESO`/`PENDIENTE_AUTORIZACION`/`AUTORIZADA`/`APLICADA`/`DEVUELTA`/`RECHAZADA`) — se corrigió el comentario erróneo del schema. Reuso clave: se extrajo `insertarMovimiento(tx, datos)` a `src/server/inventario/inventario.core.ts` (compartido por `crearMovimiento` y `autorizarToma`). Migración `0004` (ADD COLUMN trazabilidad: cerrado/devolución/rechazo) aplicada en develop. Sidebar: ítem `tomas` activado. Doc: `docs/modules/tomas.md`. Diferido: Excel/PDF (Fase 10), líneas manuales en captura, reingreso de password al autorizar (se gatea solo por permiso).
**Estado global Fase 3**: **HECHO** (código + 49 tests; verificación visual/CRUD por el usuario OK). CRUD de los **5 maestros** (Productos, Bodegas, Proveedores, Clientes, Centros de Costo) con infra UI reutilizable: `DataTable` (TanStack) + toolbar (buscador/filtro estado) + formularios en modal (patrón `useState`+`useTransition`+zod+`toast`, sin RHF) + soft/hard delete. Productos: código autogenerado (`counters.PRODUCTO`), guard de `manejaAtributos`/eliminación por `movement_lines`, selects de tipo/grupo desde sub-catálogos read-only. Proveedores/Clientes comparten schema+campos+columnas (entidad-comercial); RUT validado (`rutValido`). Sidebar: 5 ítems activados (`disponible:true`). Doc: `docs/modules/maestros.md`. Diferido: columnas de stock (Fase 4), CRUD de product_types/groups (Fase 11), Excel (Fase 10). Arreglo extra: bugs de estilo heredados de create-next-app en `globals.css` (fuente Arial, `--font-sans` autoref., media query dark que rompía contraste).

**Estado previo**: Fase 2 **HECHA y VERIFICADA** contra datos reales. **better-auth** (tabla única: la tabla `users` ES la tabla user de better-auth, con role/permissions/activo de dominio leídos aparte) + tablas `sessions`/`accounts`/`verifications` + **login por username** (el origen usa usuarios, no emails → plugin `username`) + autorización `can()`/`requirePermiso()` (38 permisos, 6 roles desde el monolito) + **shell con sidebar** (8 secciones gateadas por permiso; módulos de Fases 3-12 deshabilitados) + topbar con menú de usuario/logout + cambio de password. Provisión por **seed** (`pnpm seed:auth`): 7 credenciales creadas, password inicial fuera de banda. Verificado e2e en `develop`: migrate `0002`/`0003` aplicadas, `migrate:data` 0 discrepancias, login/redirect/logout/permisos OK, build + 39 tests verdes. Fase 1 sigue HECHA. **Pendiente**: re-correr el seed en el cutover (set-password lo hace cada usuario tras login).

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
| 1    | Schema Drizzle + migrador + datos reales | HECHO (merged) | develop (PR #2) | migrador completo: 0 discrepancias (PPP+conteos+correlativos), idempotente, develop+production (ensayo) |
| 2    | better-auth + usuarios + permisos + layout/sidebar | VERIFICADO | feat/fase-2-auth | login por username, can()/requirePermiso, sidebar gateado, seed credenciales; e2e en develop (login/redirect/logout/build/39 tests) |
| 3    | Maestros CRUD (productos, bodegas, prov., clientes, centros) | HECHO | feat/fase-3-maestros | CRUD e2e validado por el usuario (dev + DB develop); typecheck/lint/49 tests/build verdes |
| 4    | Stock + movimientos + PPP + correlativos | HECHO (merged) | develop (PR #5) | typecheck/lint/tests/build verdes |
| 5    | Tomas de inventario | HECHO | feat/fase-5-tomas | typecheck/lint/74 tests/build verdes; migración 0004 aplicada; e2e por el usuario pendiente |
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

1. **Merge del PR de Fase 2 → `develop`** (better-auth + auth schema `0002`/`0003` + shell/sidebar + seed).
2. **Cutover real** (cuando toque): congelar el monolito → forzar último sync de dispositivos → `DATABASE_URL=<prod> pnpm db:migrate && pnpm migrate:data` → validar (esperado: 0 discrepancias) → `DATABASE_URL=<prod> SEED_PASSWORD="..." pnpm seed:auth` para provisionar credenciales → entregar password inicial fuera de banda; cada usuario la cambia en `/cambiar-password`. **Orden importante**: `seed:auth` va DESPUÉS de `migrate:data` (el TRUNCATE del migrador hace CASCADE y borra los `accounts`).
3. ~~**Fase 3** (Maestros CRUD)~~ — **HECHO** en `feat/fase-3-maestros`. Falta: PR a `develop`.
4. ~~**Fase 4** (Stock + movimientos + PPP + correlativos)~~ — **HECHO/merged** (PR #5).
5. ~~**Fase 5** (Tomas de inventario)~~ — **HECHO** en `feat/fase-5-tomas`. Falta: PR a `develop` + verificación e2e/manual por el usuario (correr `pnpm dev`, probar el flujo iniciar→capturar→cerrar→autorizar/devolver/rechazar con un operador y un admin).
6. **Fase 6** (Cuaderno de Campo): reusar la infra de tablas/forms y el patrón de movimientos.

### Backlog / mejoras transversales (no bloqueantes)

- **Paginación del `DataTable`**: hoy solo "Anterior/Siguiente" (`src/components/ui/data-table.tsx`). Rehacer con paginación **numerada** (página actual resaltada + total de páginas + primera/última + selector de filas por página). Extraer a `src/components/ui/data-table-pagination.tsx` + util pura de rango de páginas (testeada).
- **nuqs (estado de tabla en la URL)**: implementar [`nuqs`](https://nuqs.dev) para sincronizar `page`/`pageSize` (y a futuro búsqueda/orden/filtros) a los query params → compartible, bookmarkable y sobrevive al refresh. Requiere `pnpm add nuqs` + `<NuqsAdapter>` en `src/app/layout.tsx` + cambiar el `useState` de paginación del `DataTable` por `useQueryStates`. Verificar compatibilidad con Next 16.2.9 (usa hooks de `next/navigation`, riesgo bajo). Empezar por paginación; búsqueda/orden/filtros tocan los toolbars (compartido + inline de movimientos/stock/tomas).

---

## Bloqueos / preguntas abiertas

- ~~**Export de Firebase**~~ — **resuelto**: lo de `index.html` es la **config web pública** (no admin); el migrador lee los 3 docs vía **SDK web + login anónimo** (igual que el monolito). Config en `.env` (gitignored).
- ~~**Railway**~~ — **resuelto**: 2 environments (`develop`/`production`) con Postgres y schema aplicado. Ojo costo Hobby ($5/mes incl.): 2 Postgres ≈ doble consumo, vigilar *Usage*.
- ~~**Usuarios sin password**~~ — **resuelto (Fase 2)**: provisión por admin vía `pnpm seed:auth` (crea `accounts` "credential" con password inicial para cada usuario activo sin credencial, idempotente); el usuario la cambia en `/cambiar-password`. Sin SMTP.
- **Login por username, no email**: los identificadores del origen son usuarios (`admin`, `rbriones`…), no emails → se usa el plugin `username` de better-auth (`signIn.username`). La columna `email` se conserva (= id) porque el modelo user de better-auth la exige, pero no se usa para login.
- **Inconsistencias de stock preexistentes**: el slice dio 0 discrepancias, pero al migrar todo conviene revisar si algún `(cod,bod)` difiere — se documentan, no se "arreglan" en silencio (migrator.md).

---

## Bitácora de sesiones

| Fecha | Sesión | Qué se hizo | Commit/PR |
|-------|--------|-------------|-----------|
| 2026-06-25 | bootstrap | Rama `develop` desde `origin/main`; sistema de handoff en `docs/` | (este commit) |
| 2026-06-26 | Fase 0 | Scaffold Next 16 + pnpm; pivot a arquitectura por capas (ADR-013); reglas en `.claude/rules` + skills en `.claude/skills`; shadcn; lint de boundaries; Drizzle (pg) + placeholder `_health`; Vitest; CI; Playwright descartado | PR #1 merged a `develop` (`8eac4e4`) |
| 2026-06-26 | Fase 1 (parcial) | Infra Railway (2 envs develop/production + Postgres); schema real (33 tablas) por dominio + migración squasheada; PPP puro + tests; zod parse/normalize 3 docs + utils coerción; migrador `scripts/migracion` (fetch SDK web+anónimo → transform → load → recalc → validate). Slice maestros+inventario migrado a `develop`: 0 discrepancias de PPP. Falta resto de dominios | `feat/fase-1-schema-migrador` (`f33a88d`, `3ff09cf`) |
| 2026-06-27 | Fase 1 (completa) | Migrador extendido a **todos los dominios** (transform por dominio + `transformAll`, `loadAll`, `migration_log`, validación de integridad: conteos/líneas/huérfanos/correlativos/RUT, counters sembrados+reajustados). Ajuste schema `invplantas.secuencia`→jsonb (`0001`) + columnas blob legacy a `$type` laxo verbatim. Corrida end-to-end **contra `develop` y `production`** (ensayo): **0 discrepancias** e idempotente. 27 tests verdes. PR #2 a `develop` | `feat/fase-1-schema-migrador` |
| 2026-06-27 | Fase 3 (maestros) | **CRUD de los 5 maestros** (Productos/Bodegas/Proveedores/Clientes/Centros de Costo) sobre infra UI reutilizable: `DataTable` (TanStack Table) + `DataTableToolbar` + `SortableHeader`; formularios en **modal** (shadcn Dialog, patrón useState/useTransition/zod/toast). Productos: correlativo `counters.PRODUCTO` (`formatCodigoProducto`), guards por `movement_lines`, hard delete; selects tipo/grupo read-only (`catalogos.queries`). Proveedores/Clientes comparten `entidad-comercial.{schema,fields,columns}` + `rutValido` extraído a `rut.utils`. Centros de Costo: código normalizado + datalist de áreas. Soft delete vía `activo`. 5 ítems de sidebar activados. Fix de estilos globales (`globals.css`). 49 tests; typecheck/lint/build verdes; CRUD validado por el usuario | `feat/fase-3-maestros` |
| 2026-06-27 | Fase 5 (tomas) | **Módulo Tomas de inventario** completo (iniciar/capturar/cerrar/autorizar+aplicar/devolver/rechazar). Lógica pura `calcularAjustes`/`construirLineasTeoricas` (11 tests). Server `tomas.{queries,actions}`; helper compartido `insertarMovimiento` extraído a `inventario.core.ts` (DRY con `crearMovimiento`). UI `(app)/tomas` (lista + modal inicio + detalle con captura/autorización/lectura). Estados verbatim del monolito (fix del comentario del schema). Migración `0004` (columnas trazabilidad) aplicada en develop. Migrador `sci-tomas` mapea los nuevos campos de origen. Sidebar activado. **Bugfix transversal:** el `Select` de base-ui mostraba el value crudo → se agregó `items={...}` a todos los selects del proyecto (tomas/productos/movimientos/stock + `data-table-toolbar`). Backlog: rehacer paginación numerada + nuqs (documentado). typecheck/lint/74 tests/build verdes | `feat/fase-5-tomas` (PR) |
| 2026-06-27 | Fase 2 (auth) | **better-auth** (tabla única: `users` = tabla user de better-auth con remapeo `name`→`nombre`, `createdAt`→`creadoAt`, `updatedAt`→`modificadoAt`; role/permissions/activo leídos aparte en `getUsuarioActual`). Tablas `sessions`/`accounts`/`verifications` (`0002`, backfill `email`=`id`). **Login por username** (plugin `username`, `0003` backfill `username`=lower(id)). Catálogo `permisos`/`navegacion` desde el monolito; `can()`/`itemVisible`/`requireAuth`/`requirePermiso`. Shell `(app)` (sidebar gateado + topbar/logout), `(auth)` (login + cambiar-password), `proxy.ts` (chequeo optimista de cookie, Next 16 renombró middleware→proxy). Seed `pnpm seed:auth` (7 credenciales). e2e en develop: migrate+migrate:data 0 discrepancias, login/redirect/logout OK, build + 39 tests | `feat/fase-2-auth` |
