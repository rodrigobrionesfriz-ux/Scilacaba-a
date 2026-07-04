# Módulo: Deploy Railway + Hardening

**Fase**: 12 · **Estado**: HECHO (código; deploy real y verificación e2e por el usuario)
**Ubicación**: `railway.json`, `next.config.ts`, `src/lib/env.ts`, `src/schemas/env.schema.ts`, `src/constants/{security,auth}.constants.ts`, `src/server/auth/auth.ts`, `src/app/api/health/route.ts`, `src/proxy.ts`

## Alcance

Desplegar la app en Railway (ADR-005: 2 environments `develop`/`production`, cada uno con su Postgres) con migraciones automáticas en cada release, y aplicar el hardening de producción. Ver **ADR-018** para las decisiones.

No cubre: CDN/edge externo, réplicas múltiples (el rate limit en memoria asume 1 instancia), restore automatizado de backup (se documenta a nivel Postgres, abajo).

## Arquitectura de deploy (Nixpacks)

- **Builder**: Nixpacks autodetecta Next.js. `railway.json` fija:
  - `deploy.startCommand`: `pnpm start` (`next start`).
  - `deploy.preDeployCommand`: `pnpm db:migrate` (drizzle-kit) — corre **antes** de conmutar tráfico, aplica las migraciones pendientes al Postgres del environment (idempotente).
  - `deploy.healthcheckPath`: `/api/health` (liveness shallow, sin DB), `healthcheckTimeout` 120s.
  - `deploy.restartPolicyType`: `ON_FAILURE`.
- **Migraciones** vía `drizzle-kit migrate` (drizzle-kit es devDependency; Nixpacks instala todas las deps en build → está disponible en el preDeploy). Si el environment forzara `NODE_ENV=production` en el install, pnpm omitiría devDeps → fallback: un script programático con `drizzle-orm/node-postgres/migrator` (drizzle-orm sí es runtime dep). Verificar en el primer deploy.

## Hardening (código)

| Área        | Qué                                                                                     | Dónde                                                                                     |
| ----------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Env         | Validación zod al arranque (falla temprano y claro)                                     | `src/schemas/env.schema.ts` + `src/lib/env.ts` (consumido por `db/client.ts` y `auth.ts`) |
| Headers     | CSP + HSTS + nosniff + X-Frame-Options + Referrer/Permissions-Policy en todas las rutas | `src/constants/security.constants.ts` → `next.config.ts` `headers()`                      |
| Auth        | `trustedOrigins` (CSRF) + `rateLimit` (global + login `/sign-in/username`)              | `src/server/auth/auth.ts` + `src/constants/auth.constants.ts`                             |
| Healthcheck | `/api/health` shallow; proxy excluye `/api`                                             | `src/app/api/health/route.ts` + `src/proxy.ts`                                            |

**Variables de entorno de runtime** (validadas): `DATABASE_URL`, `BETTER_AUTH_SECRET` (≥32 chars), `BETTER_AUTH_URL`. Las `FIREBASE_*`/`SEED_PASSWORD` son **solo de scripts** (migrador/seed), no del runtime.

## Runbook operativo (lo ejecuta el usuario)

### 1. Por cada environment (`develop`, `production`)

1. Crear servicio en Railway desde el repo, apuntando al branch correspondiente (`develop` → env develop; `main` → env production).
2. Añadir el plugin **Postgres** al environment.
3. Setear variables del servicio (**antes** del primer build — la validación corre en `next build`):
   - `DATABASE_URL` = referencia `${{Postgres.DATABASE_URL}}`.
   - `BETTER_AUTH_SECRET` = `openssl rand -base64 32` (**distinto por environment**).
   - `BETTER_AUTH_URL` = dominio público del environment (p.ej. `https://sci-develop.up.railway.app`; o el dominio custom).
4. Confirmar que Railway usa `railway.json` (builder Nixpacks) y el healthcheck `/api/health`.

### 2. Primer deploy

- Push al branch → Railway construye con Nixpacks → corre `preDeployCommand` (`pnpm db:migrate`) → arranca `pnpm start`.
- Verificar en los logs: el preDeploy aplica migraciones sin error y el healthcheck queda verde.

### 3. Cutover de datos (producción) — evento único

Correr **localmente** (requiere `FIREBASE_*` + `tsx`, ausentes en el runtime de Railway), con un `.env` que tenga `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL` presentes (los valida `db/client` transitivamente) y apuntando a la DB de producción:

```bash
DATABASE_URL=<prod> pnpm db:migrate          # o dejar que lo haga el preDeploy
DATABASE_URL=<prod> pnpm migrate:data        # lee Firebase (3 docs) → carga Postgres
# validar: 0 discrepancias (PPP + integridad) en la salida del migrador
DATABASE_URL=<prod> SEED_PASSWORD="..." pnpm seed:auth
```

**Orden crítico**: `seed:auth` va **después** de `migrate:data` (el TRUNCATE del migrador hace CASCADE y borra los `accounts`). Password inicial fuera de banda; cada usuario la cambia en `/cambiar-password`.

### 4. Verificación en el dominio de producción

- Login por username, cambio de password.
- Módulos offline (Terreno): PWA instalable, captura offline, "Subir a la nube".
- Headers de seguridad presentes; sin errores CSP en consola.

## Restore de respaldo (a nivel Postgres, no en-app — ADR-017)

El backup en-app es **export-only** (JSON de dominio). La restauración real usa las herramientas de Postgres/Railway:

- Railway ofrece backups del plugin Postgres (panel del servicio).
- Manual: `pg_dump <DATABASE_URL> > dump.sql` / `psql <DATABASE_URL> < dump.sql`.

## Verificación end-to-end (local, sin Railway)

- `pnpm typecheck && pnpm lint && pnpm test` (no requieren DB).
- Con `.env` válido: `pnpm build && pnpm start`, luego:
  - `curl -i localhost:3000/api/health` → `200 {"status":"ok"}` **sin** redirect a `/login`.
  - `curl -I localhost:3000/` → CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, Referrer/Permissions-Policy presentes.
  - `curl -i localhost:3000/sw.js` → `200 application/javascript` (SW intacto).
  - Navegador: la app carga sin errores CSP; el SW se registra (DevTools → Application → Service Workers); GPS de Terreno funciona (`geolocation=(self)`).
- Rate limit: >8 POST rápidos a `/api/auth/sign-in/username` con credenciales malas → `429`.

## Riesgos / gotchas

- **`next build` peta sin env**: la validación se evalúa en build. Railway inyecta las vars → setearlas antes. Local: `.env`.
- **CSP `'unsafe-inline'`**: necesario para el shell de Next; menos protección XSS (aceptable en app interna). Nonce = endurecimiento futuro (movería el CSP al proxy + matcher que cubra `/login`).
- **Rate limit en memoria**: se resetea por redeploy, por-instancia. Escalar a réplicas → `storage: "database"` (tabla nueva + migración).
- **IP tras proxy**: better-auth keyea por `x-forwarded-for`; verificar que Railway propague la IP real (si no, el límite se aplicaría global).

## Checklist de verificación end-to-end

- [ ] Servicio + Postgres creados en ambos environments con las 3 vars de runtime.
- [ ] Primer deploy: preDeploy migra sin error, healthcheck verde.
- [ ] `/api/health` responde 200 sin redirect; headers de seguridad presentes.
- [ ] Login + cambio de password OK en el dominio de prod.
- [ ] Terreno offline (PWA + GPS) OK.
- [ ] Cutover de producción: `migrate:data` 0 discrepancias → `seed:auth` → passwords entregadas.
