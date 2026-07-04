# Módulo: Auditoría

**Fase**: 11 · **Estado**: HECHO (código + tests; e2e/manual por el usuario pendiente)
**Ubicación**: `src/server/audit/`, `src/app/(app)/auditoria/`

## Alcance (qué replica del original)

- Vista de **registro de actividad** (solo administradores), últimas 500 acciones ordenadas desc por fecha. Referencia monolito: `renderAuditoria` (index.html:12358), store `audit` + función `audit()` (index.html:2483).
- **Escritura del trail**: helper `registrarAuditoria` cableado en las mutaciones existentes (ADR-016). En v2 la tabla `audit` tenía datos migrados pero ningún action escribía en ella.
- **Export Excel** de la auditoría (nuevo respecto al monolito, que solo la incluía en el dump JSON global).
- NO cubre: filtros por rango de fecha/usuario (el monolito tampoco los tenía); solo búsqueda global en la tabla.

## Modelo de datos

- Tabla `audit` (`src/db/schema/sistema.ts`): `id` (PK, `crypto.randomUUID()`), `fecha`, `usuario`, `accion`, `detalle`, `referencia`. Sin migración nueva.

## Lógica / capas

- Pura: `src/utils/audit.utils.ts` `construirEntradaAudit(usuarioId, accion, detalle, referencia)` (usuario ausente → `"system"`).
- Helper de escritura: `src/server/audit/audit.core.ts` `registrarAuditoria({usuario, accion, detalle, referencia?})` — inserta con id+fecha; **envuelto en try/catch** (nunca rompe la mutación que la invoca).
- Lectura: `src/server/audit/audit.queries.ts` `getAuditoria()` (limit 500 desc).
- Export: `src/server/audit/audit.actions.ts` `exportarAuditoriaExcel()` (`requireAdmin`).
- Fecha formateada por `src/utils/fecha.utils.ts` `fmtFechaHora`.

## Cobertura del trail (acciones cableadas)

Réplica de la cobertura del monolito en el dominio de inventario + los módulos nuevos de esta fase:

- Maestros: `producto.crear/editar`, `bodega.crear/editar`, `proveedor.crear/editar`, `cliente.crear/editar`, `centroCosto.crear/editar`.
- Movimientos: `movimiento.crear`, `movimiento.anular`.
- Tomas: `toma.iniciar/cerrar/autorizar/devolver/rechazar`.
- Config (Fase 11): `config.empresa.update`, `config.indicadores.update`, `tipo.crear/editar/eliminar`, `grupo.crear/editar/eliminar`.
- Usuarios (Fase 11): `usuario.crear`, `usuario.editar`.

**No auditados** (igual que el monolito): Cuaderno de Campo, Fertirriego, Terreno, Mantenciones, Presupuesto.

## UI

- Ruta `/auditoria` (`requireAdmin` → `perm: null, adminOnly: true` en el sidebar). `page.tsx` (≤20 líneas) → `auditoria.view.tsx` → `auditoria.table.tsx` (DataTable + búsqueda global) → `auditoria.columns.tsx` (Acción como Badge, fecha/referencia mono).

## Checklist de verificación end-to-end

- [ ] `admin` → `/auditoria` lista las últimas 500 (orden desc).
- [ ] Crear producto / movimiento / autorizar toma → aparecen filas nuevas con `accion` y `usuario` correctos.
- [ ] Rol no-admin (`gerente`) es redirigido a `/dashboard`.
- [ ] "Exportar Excel" descarga con las columnas Fecha/Usuario/Acción/Detalle/Referencia.
