# Módulo: Autenticación, usuarios y permisos (auth)

**Fase**: 2 · **Estado**: VERIFICADO
**Ubicación** (arquitectura por capas, ADR-013): `src/server/auth/`, `src/lib/auth-client.ts`,
`src/app/(auth)/`, `src/app/(app)/`, `src/constants/{permisos,navegacion}.constants.ts`,
`src/utils/permisos.utils.ts`, `src/proxy.ts`, `scripts/seed/auth.ts`.

## Alcance (qué replica del original)

- **Login/logout** con sesión persistente; **autorización** por rol + permisos granulares.
- **Shell** de la app: sidebar de navegación (8 secciones) gateado por permiso + topbar con
  menú de usuario. Cambio de contraseña.
- Referencia en el monolito (`index.html`): `PERMISSIONS`/`ROLE_PERMS`/`ROLE_LABELS`/`can()`
  (líneas 2325-2389), `NAV` (2627-2662). El monolito usaba password admin hardcodeada +
  Firebase anónimo → reemplazado por **better-auth** (ADR-004).
- **NO cubre** (por fase posterior): UI de gestión de usuarios (Fase 3+, permiso `usuarios.*`),
  reset/verificación por email (no hay SMTP), 2FA.

## Decisiones de diseño (esta fase)

- **Tabla única**: la tabla `users` ES la tabla `user` de better-auth (adapter Drizzle). Sus
  columnas en español se remapean a los campos canónicos en `src/server/auth/auth.ts`
  (`name`→`nombre`, `createdAt`→`creadoAt`, `updatedAt`→`modificadoAt`). `role`/`permissions`/
  `activo` NO los gestiona better-auth → se leen aparte con `getUsuarioActual()`.
- **Login por username**: los identificadores del origen son usuarios (`admin`, `rbriones`…), no
  emails → plugin `username` (`signIn.username`). `email` se conserva (= id) porque el modelo user
  lo exige, pero no se usa para login.
- **Provisión por seed** (no auto-servicio): `pnpm seed:auth` crea credenciales iniciales; el
  usuario cambia su password tras el login. Sin SMTP.

## Modelo de datos (tablas Drizzle — `src/db/schema/sistema.ts`)

- `users` (tabla user de better-auth + dominio): `id` (PK, = username/email para migrados),
  `nombre`, `username` (unique), `displayUsername`, `email` (unique notNull), `emailVerified`,
  `image`, `role` (default `consulta`), `permissions` (text[]), `activo`, `creadoAt`, `modificadoAt`.
- `sessions`, `accounts` (credencial: `providerId="credential"`, `password` hasheada),
  `verifications` — esquema canónico de better-auth, FKs a `users.id` con `onDelete cascade`.
- Migraciones: `0002` (auth tables + email/emailVerified/image, backfill `email`=`id`), `0003`
  (username/displayUsername, backfill `username`=lower(id)).

## Server / guards (`src/server/auth/`)

| Símbolo | Propósito |
|--------|-----------|
| `auth` (`auth.ts`) | Instancia better-auth (drizzleAdapter, emailAndPassword `disableSignUp`, plugins `username`+`nextCookies`) |
| `getSesion()` | Sesión cruda de better-auth (`auth.api.getSession`) |
| `getUsuarioActual()` | `UsuarioActual` (identidad + role/permissions/activo de `users`) o null |
| `requireAuth()` | Exige sesión activa o `redirect("/login")` |
| `requirePermiso(permiso: Permiso)` | Exige permiso o `redirect("/dashboard")`. Guard para queries/actions de Fase 3+ |

Handler API: `src/app/api/auth/[...all]/route.ts` (`toNextJsHandler(auth)`).
Cliente: `src/lib/auth-client.ts` (`signIn`/`signOut`/`changePassword`, plugin `usernameClient`).

## Lógica de dominio (`src/utils/permisos.utils.ts`)

- `can(user, permiso)`: `admin` → todo; resto → `permissions.includes(permiso)` (ADR-004).
- `itemVisible(user, item)`: visibilidad de ítem de nav (`adminOnly` → solo admin; sin perm →
  visible; con perm → `can`).
- Catálogo en `src/constants/permisos.constants.ts`: `PERMISOS` (38), `ROLES` (6), `ROLE_LABELS`,
  `ROLE_PERMS` (defaults por rol).

## UI (`src/app`)

- `(auth)/login` → `login.form` (client, `signIn.username`).
- `(auth)/cambiar-password` → `cambiar-password.form` (client, `changePassword`).
- `(app)/layout` (server, `requireAuth`) → `app.sidebar` (client, NAV filtrado por permiso, ítems
  no construidos deshabilitados) + `app.topbar` (client, menú usuario/logout).
- `src/proxy.ts`: chequeo optimista de cookie (Next 16 renombró `middleware`→`proxy`).

## Reglas de negocio (lo no obvio)

- El TRUNCATE del migrador (`load.ts`) usa `RESTART IDENTITY CASCADE` → re-correr `migrate:data`
  borra los `accounts`. Por eso `seed:auth` va **después** de `migrate:data`.
- better-auth valida formato de email en `signIn.email` (hard-coded) → por eso login es por
  username, no email.
- CSRF: las llamadas POST de auth requieren header `Origin` (el client lo envía; curl sin `Origin`
  da 403 en sign-out — no es bug).

## Checklist de verificación end-to-end

- [x] Sin sesión, `/dashboard` → redirige a `/login` (307).
- [x] Login con credencial válida (`admin`/`Sci.Temporal.2026`) → 200 + cookie de sesión.
- [x] Password incorrecta → 401.
- [x] Con sesión, `/dashboard` → 200 con shell (sidebar + topbar).
- [x] Sidebar gateado: `admin` ve Auditoría (adminOnly); ítems no construidos deshabilitados.
- [x] Logout (`signOut`) → 200; vuelve a `/login`.
- [x] `name` resuelto desde `nombre` (remapeo de campos OK: user.name = "Administrador").
- [x] `migrate:data` 0 discrepancias con `username`/`email`/`emailVerified`.
- [x] `seed:auth` idempotente (7 credenciales; re-correr → 0 nuevas).
- [ ] (Fase 3+) Usuario sin permiso de un módulo recibe redirect/forbidden vía `requirePermiso`.

## Evidencia de verificación

- `pnpm typecheck` ✓ · `pnpm lint` ✓ · `pnpm test` → **39 tests** verdes · `pnpm build` ✓.
- `pnpm migrate:data` → 0 discrepancias (PPP + integridad) · `pnpm seed:auth` → 7 credenciales,
  2 admins.
- Flujo runtime (curl contra `pnpm dev`): redirect 307 sin sesión, sign-in 200 + cookie,
  password mala 401, `/dashboard` 200 con cookie, sign-out 200 (con `Origin`), HTML del dashboard
  contiene todas las secciones del sidebar + rol "Administrador".
