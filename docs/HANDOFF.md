# HANDOFF — SCI v2

> **Este es el PUNTO DE ENTRADA.** Cualquier sesión nueva (humano o agente) empieza leyendo este archivo de principio a fin antes de tocar nada. Se actualiza **cada sesión**.

**Última actualización**: 2026-06-25 por sesión de bootstrap (Claude)
**Rama activa**: `develop`
**Estado global**: Bootstrap hecho (ramas + sistema de handoff). Fase 0 pendiente.

---

## Cómo retomar (léelo primero)

1. `git fetch && git checkout develop && git pull`
2. Si vas a trabajar una fase: `git checkout -b feat/fase-<n>-<modulo>` desde `develop`.
3. Lee `docs/SPEC.md` (qué construimos), `docs/DECISIONS.md` (por qué así) y el `docs/modules/<modulo>.md` de lo que toques.
4. (Cuando exista el proyecto Next.js) baseline verde antes de tocar: `npm ci && npm run db:migrate && npm test && npm run typecheck`.
5. Mira **"En curso ahora mismo"** y **"Próximos pasos"** abajo.
6. Al terminar la sesión: **actualiza este archivo** (estado, en curso, próximos pasos) y commitea, aunque el trabajo quede a medias. El estado vive en el repo, no en la memoria de la sesión.

---

## Estado por fase

Estados: `PENDIENTE` | `EN CURSO` | `HECHO` (código + tests) | `VERIFICADO` (e2e/manual con evidencia)

| Fase | Módulo / contenido | Estado | Rama / PR | Verificado |
|------|--------------------|--------|-----------|------------|
| —    | Bootstrap (ramas + docs/) | HECHO | develop | sí |
| 0    | Scaffold + tooling + CI + Railway/Postgres | PENDIENTE | — | — |
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
- Screaming Architecture modular (ADR-006).
- Git-flow con `develop` (ADR-007).
- PPP en función pura compartida action+migrador (ADR-008).
- IDs determinísticos de lotes para recálculo idempotente (ADR-009).
- Migración desde 3 docs Firestore, no del backup JSON (ADR-010).
- Postgres reafirmado sobre Firestore (ADR-011); shadcn/ui + Tailwind confirmado (ADR-012).

---

## En curso ahora mismo

**Nada en curso.** Bootstrap recién terminado: rama `develop` creada desde `origin/main`, sistema de handoff (`docs/`) materializado.

---

## Próximos pasos (orden)

1. **Fase 0 — Scaffold + tooling**: convertir la Fase 0 en plan ejecutable con `writing-plans` (`docs/plans/fase-0.md`), luego:
   - `create-next-app` (TS, App Router, Tailwind) dentro del repo, estructura `src/modules` + `src/shared`.
   - Configurar shadcn/ui, ESLint (con lint de boundaries), Prettier, Vitest, Playwright.
   - Drizzle + drizzle-kit + `drizzle.config.ts`.
   - GitHub Actions CI (typecheck, lint, test, build).
   - Provisionar Postgres en Railway; `.env.example` con `DATABASE_URL`.
   - Entregable: app vacía corriendo, CI verde, `npm run db:migrate` funcionando.
2. **Fase 1 — Schema + migrador**: ver plan.

---

## Bloqueos / preguntas abiertas

- **Export de Firebase**: confirmar cómo se obtendrá el dump de los 3 docs Firestore (`sci/main`, `cuaderno/main`, `presupuesto/main`) — credenciales firebase-admin o export manual. Necesario para Fase 1.
- **Railway**: el usuario tiene cuenta. Falta crear el proyecto y obtener `DATABASE_URL` (Fase 0).
- **Usuarios sin password**: el origen usa Firebase anónimo; definir flujo de set-password en primer login (Fase 2).

---

## Bitácora de sesiones

| Fecha | Sesión | Qué se hizo | Commit/PR |
|-------|--------|-------------|-----------|
| 2026-06-25 | bootstrap | Rama `develop` desde `origin/main`; sistema de handoff en `docs/` | (este commit) |
