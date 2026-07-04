# Módulo: Usuarios

**Fase**: 11 · **Estado**: HECHO (código + tests; e2e/manual por el usuario pendiente)
**Ubicación**: `src/server/usuarios/`, `src/app/(app)/usuarios/`

## Alcance (qué replica del original)

- CRUD de usuarios con rol y permisos granulares (referencia monolito: alta/edición de usuario, index.html:8958). Permisos existentes: `usuarios.ver` (lectura), `usuarios.crear` (mutaciones).
- **Crear** usuario: fila en `users` + credencial (mismo path que el seed — `context.internalAdapter.linkAccount` con password hasheada). El email se deriva del username (`<username>@sci.local`); el login es por username.
- **Editar** nombre/rol/permisos/activo. **Restablecer contraseña**. **Activar/Desactivar**.
- Al elegir rol, el grid de permisos se auto-marca con `ROLE_PERMS[rol]` (editable manualmente).

## Modelo de datos

- Tabla `users` (better-auth + dominio: `role`, `permissions[]`, `activo`) + `accounts` (credencial). Sin migración nueva.

## Server Actions (`usuarios.actions.ts`, permiso `usuarios.crear`)

| Action | Efecto | Auditoría |
|--------|--------|-----------|
| `crearUsuario` | inserta `users` + linkAccount credential | `usuario.crear` |
| `editarUsuario` | actualiza nombre/rol/permisos/activo | `usuario.editar` |
| `resetearPassword` | re-hashea el `accounts.password` (o linkAccount) | `usuario.editar` |
| `toggleActivo` | activa/desactiva | `usuario.editar` |

## Reglas de negocio (lo no obvio)

- **Último admin activo**: `esUltimoAdminActivo` (`src/utils/usuarios.utils.ts`) bloquea quitarle el rol admin o desactivarlo (en `editarUsuario` y `toggleActivo`).
- **Username único**: `crearUsuario` rechaza duplicados.

## UI

- Ruta `/usuarios` (`requirePermiso("usuarios.ver")`). `page.tsx` → `usuarios.view.tsx` → `usuarios.table.tsx` (DataTable + búsqueda + filtro por rol) → `usuarios.columns.tsx`. Formularios: `usuarios.form.tsx` (crear/editar + grid de permisos), `usuarios.reset-password.tsx`, `usuarios.toggle.tsx`. Mutaciones visibles solo con `usuarios.crear`.

## Checklist de verificación end-to-end

- [ ] `admin` crea usuario (rol operador → permisos autocompletados); login con la password inicial.
- [ ] Editar rol/permisos → el sidebar del usuario refleja el cambio.
- [ ] Desactivar → el usuario no puede iniciar sesión.
- [ ] Intentar quitar admin / desactivar al último admin activo → bloqueado.
- [ ] Restablecer contraseña funciona; el usuario entra con la nueva.
- [ ] Rol con solo `usuarios.ver` ve la tabla sin botones de mutación.
