# Módulo: Servicio y Mantención (Mantenciones)

**Fase**: 8 · **Estado**: HECHO (código + tests; e2e/manual por el usuario pendiente)
**Ubicación**: `src/app/(app)/mantenciones/`, `src/server/mantenciones/`, `src/{schemas,types,constants,utils}/mantenciones.*`

Primer módulo fuera de Terreno/Cuaderno. Módulo **online** (Server Actions, sin offline). Reescritura del módulo "Servicio y Mantención" del monolito (`index.html:11720-12354`).

## Alcance (qué replica del original)

- **Órdenes de Trabajo (OT)**: CRUD con líneas de detalle dinámicas, correlativo `OT-000001` (6 dígitos), estado `Abierta`/`Facturada`. El "activo/equipo" es texto libre (no hay catálogo de equipos, igual que el monolito).
- **Dashboard**: KPIs (Total OT, Abiertas, Facturadas, Monto total) + filtros (búsqueda, categoría, estado).
- **Facturación**: registra la factura de una OT y **genera un movimiento de ENTRADA `SERVICIO/MANTENCION`** en la bodega de servicios `BSERV` (producto de servicio de la categoría, `costo = monto neto`), reusando el motor PPP de Movimientos. Marca la OT como Facturada.
- **Reversión**: eliminar la factura (vuelve a Abierta) o la OT facturada revierte el movimiento (borra + recalcula PPP).
- **Export Excel** (exceljs): hoja "Órdenes de Trabajo" + hoja "Detalle líneas".
- Referencia monolito: `renderMantenciones`/`renderMantTable` (`:11772`/`:11829`), `openOTForm`/`guardarOT` (`:11878`/`:12000`), `verOT` (`:12024`), `guardarFactura` (`:12128`), `eliminarFacturaOT`/`eliminarOT` (`:12196`/`:12227`), `exportMantencionesExcel` (`:12328`), constantes (`:11720-11730`).
- **NO cubre** (deliberado): estado `Anulada` (existía en UI del monolito pero nunca se asignaba); "recuperar OT desde movimientos huérfanos" (workaround frágil que parseaba strings — innecesario en el modelo relacional); catálogo de equipos con historial de horómetro (no existe en el monolito).

## Modelo de datos (tablas Drizzle)

Ya migradas en Fase 1, **sin migración nueva**:
- `maintenance_orders` (`src/db/schema/mantenciones.ts`): PK `id` (text), `numero`, `fecha` (date), `categoria`, `activo`, `descripcion`, `proveedorCodigo` (FK→`providers`, opcional), `total` numeric, `estado`, `factura` jsonb (objeto embebido), `creadoAt`, `updatedAt`.
- `maintenance_order_lines`: PK serial, `orderId` (FK→`maintenance_orders`, **onDelete cascade**), `tipo`, `productoCodigo` (sin FK), `productoNombre`, `detalle`, `cantidad`, `valorUnit`.
- Correlativo: `counters.OT` (sembrado perezosamente al `max` existente la primera vez — ver `siguienteNumeroOT`). Movimiento de factura: prefijo `SERV` (registrado en `movimientos.constants`).
- La `factura` jsonb guarda `{ tipoDoc, numeroDoc, fecha, monto, obs, horometro, movimiento }`; `movimiento` = nº del movimiento SCI (vínculo OT↔movimiento para revertir).

## Server Actions (`src/server/mantenciones/mantenciones.actions.ts`)

| Action | Entrada (zod) | Permiso | Efectos | Revalida |
|--------|---------------|---------|---------|----------|
| `crearOrden` | `ordenTrabajoSchema` | `mantenciones.crear` | Inserta OT (Abierta) + líneas; correlativo OT | `/mantenciones` |
| `editarOrden(id, …)` | `ordenTrabajoSchema` | `mantenciones.crear` | Update cabecera + reemplazo de líneas | `/mantenciones` |
| `eliminarOrden` | `otIdSchema` | `mantenciones.eliminar` | Revierte movimiento si facturada; borra OT (cascade) | `/mantenciones` + stock |
| `registrarFactura` | `facturaSchema` | `mantenciones.facturar` | Movimiento ENT en BSERV + recalc PPP; OT→Facturada | `/mantenciones` + stock |
| `eliminarFactura` | `otIdSchema` | `mantenciones.eliminar` | Revierte movimiento; OT→Abierta, factura=null | `/mantenciones` + stock |
| `exportarMantencionesExcel` | — | `mantenciones.ver` | Genera .xlsx (base64) | — |

"+ stock" = revalida también `/movimientos`, `/stock`, `/productos`, `/bodegas`.

Helpers (`mantenciones.core.ts`): `ensureBodegaServicios` / `ensureProductoServicio` (upsert idempotente de BSERV y del producto de servicio antes de facturar) y `siguienteNumeroOT` (correlativo atómico con seed al max). Reusa `insertarMovimiento` + `recalcularStockScoped` de `src/server/inventario`.

## Lógica de dominio (`src/utils/mantenciones.utils.ts`, +13 tests)

- `calcularSubtotal` / `calcularTotalOT` (Σ cantidad×valorUnit) — fuente de verdad del total (form preview + action).
- `formatNumeroOT` (padStart 6), `resolverProductoServicio` (fallback Maquinarias), `descripcionMovimientoFactura`.
- `construirObservacionFactura` (observación auto del movimiento, verbatim `index.html:12157`).
- `narrowFactura` (narrowing del blob jsonb sin `as`, regla 11).

## UI (`src/app/(app)/mantenciones/(sections)/`)

`mantenciones.view` (fetch + KPIs + tabla), `.kpis`, `.table` (toolbar: búsqueda + estado + categoría + Nueva OT), `.columns`, `.form` (OT crear/editar con líneas dinámicas + total en vivo), `.detalle` (Dialog readonly: cabecera + líneas + factura), `.factura-form` (registrar factura), `.factura-delete` (quitar factura), `.delete` (eliminar OT), `.export` (botón Excel).

## Reglas de negocio (lo no obvio)

- La Server Action recalcula el **total en servidor** desde las líneas (no confía en el cliente). Las líneas sin producto/detalle/valor se descartan (paridad monolito).
- Facturar exige **proveedor asignado** y que la OT no esté ya facturada.
- El movimiento de factura usa producto **no inventariable** en `BSERV`: registra valor, no controla stock físico. El `tipoDoc` se guarda en la factura en su forma original y en el movimiento en mayúsculas.
- Añadir `SERVICIO/MANTENCION` a `TIPOS_MOV_ENT`/`PREFIJO_MOV` lo expone (como `TOMA INVENTARIO ENT`) en el select del form manual de Movimientos — comportamiento preexistente aceptado.

## Checklist de verificación end-to-end

- [ ] Login **admin** → `/mantenciones`: crear OT con líneas (total en vivo, correlativo `OT-*` sin colisión con las migradas), editar, ver detalle.
- [ ] KPIs y filtros (categoría/estado/búsqueda) correctos.
- [ ] Registrar factura → movimiento `SERVICIO/MANTENCION` en `/movimientos` (BSERV, costo=monto), stock/valor de BSERV actualizado en `/stock`, OT→Facturada.
- [ ] Quitar factura → movimiento revertido, OT→Abierta.
- [ ] Eliminar OT facturada → revierte también el movimiento.
- [ ] Exportar Excel → 2 hojas correctas.
- [ ] **gerente**: solo lectura (sin botones crear/facturar/eliminar). **operador/agronomo**: no ve el módulo (redirigido).
- [x] typecheck/lint/**222 tests**/build verdes (SW: 71 precache entries).

## Evidencia de verificación

- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` verdes (2026-07-02).
- Manual/e2e por el usuario: pendiente.
