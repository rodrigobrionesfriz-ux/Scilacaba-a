# Módulo: Configuración (+ Respaldo)

**Fase**: 11 · **Estado**: HECHO (código + tests; e2e/manual por el usuario pendiente)
**Ubicación**: `src/server/config/`, `src/server/backup/`, `src/app/(app)/config/`

## Alcance (qué replica del original)

Pantalla de Configuración con pestañas (referencia monolito: `renderConfig`, index.html:9335):

1. **Empresa** — datos de la empresa (`config.empresa`: nombre, rut, dirección, giro, teléfono, correo, logo base64, recupIEC). Guardar en `config.editar`; RUT validado con `rutValido`.
2. **Tipos y grupos** — CRUD de `product_types` y `groups` (subgrupos). Guards de borrado: no eliminar un tipo/grupo con productos asignados; no quitar un subgrupo en uso.
3. **Indicadores** — tabla editable USD/UTM/UF por mes y temporada (`config.indicadoresDiarios`). Temporada agrícola Mayo→Abril.
4. **Apariencia** — selector de tema claro/oscuro/sistema (next-themes, local por dispositivo). **Desviación** (ADR-017): claro/oscuro estándar de shadcn en vez de los temas de marca sap/forestal del monolito.
5. **Respaldo** (solo admin) — export JSON de todas las tablas de dominio (ADR-017).

## Modelo de datos

- Tabla `config` (key-value `clave`/`valor` jsonb): claves `empresa`, `indicadoresDiarios`. Patrón `onConflictDoUpdate` (igual que presupuesto).
- Tablas `product_types`, `groups` (ya existentes). Sin migración nueva.

## Lógica / capas

- Utils puros: `src/utils/config.utils.ts` (`narrowEmpresa`, `narrowIndicadoresRoot`, `normalizarSubgrupos`), `src/utils/indicadores.utils.ts` (`temporadaActual`, `parseIndicador`, `listarTemporadas`, `anioDeMesEnTemporada`, `construirMeses`, `fusionarTemporada`).
- Server: `config.queries.ts` (`getEmpresa`, `getIndicadores`, `getTiposConfig`, `getGruposConfig`), `config.actions.ts` (`guardarEmpresa`, `crear/editar/eliminarTipo`, `crear/editar/eliminarGrupo`, `guardarIndicadores` — todos `config.editar` + auditoría).
- Tema: `ThemeProvider` (next-themes) en `src/app/layout.tsx`; `src/components/ui/theme-provider.tsx`.

## Respaldo (export JSON, ADR-017)

- `src/server/backup/backup.actions.ts` `exportarBackupJson()` (`requireAdmin`): lee todas las tablas de dominio (lista canónica `BACKUP_TABLAS` en `src/constants/backup.constants.ts`), arma `{version, fecha, tablas}` (`construirBackup`), lo devuelve base64 → descarga (`JSON_MIME`).
- **Excluye a propósito**: `accounts`, `sessions`, `verifications` (credenciales/tokens) y `migration_log`.
- **No hay restore en-app**: la restauración se hace a nivel Postgres (pg_dump / Railway).

## Checklist de verificación end-to-end

- [ ] Editar Empresa (RUT inválido → error; válido → persiste; logo se previsualiza).
- [ ] Crear/editar/eliminar tipo y grupo; borrado bloqueado si hay productos usándolo; quitar subgrupo en uso bloqueado.
- [ ] Editar indicadores de una temporada; otra temporada no se pierde.
- [ ] Toggle de tema claro/oscuro persiste al refrescar.
- [ ] Rol con solo `config.ver` ve todo en modo lectura (inputs deshabilitados, sin botones de guardar/editar).
- [ ] `admin` → pestaña Respaldo descarga `SCI_backup_<fecha>.json` con tablas de dominio y **sin** `accounts/sessions/verifications`. Rol no-admin no ve la pestaña.
