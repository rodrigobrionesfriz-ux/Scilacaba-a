# Migrador Firebase → Postgres

Cómo se migran los datos reales de producción del monolito (Firestore) al Postgres de SCI v2. Código en `src/modules/migracion/`.

## Fuentes (3 documentos Firestore)

| Doc | Contenido | Notas |
|-----|-----------|-------|
| `sci/main.payload` | JSON de los 18 stores IndexedDB | Fuente primaria de inventario. Incluye acumulativos. |
| `cuaderno/main.payload` | `{ panos, registros, productos, ordenes, confirmaciones, oCounter, fertirriego, prodPorEstado }` | Objeto `S` del cuaderno. |
| `presupuesto/main.payload` | Datos de presupuesto | — |

> **NO usar el backup JSON local** como fuente: omite `mantenciones, conteos, estimaciones, invplantas` y el cuaderno (ADR-010). Sirve solo como cross-check.

## Pipeline

`fetch` (firebase-admin baja los 3 docs) → `parse` + normalizar con zod → `load` por orden de FKs → **recalcular `stock` desde `movement_lines`** → **validar**.

- **Idempotente**: upsert por PK natural; tablas hijas (`movement_lines`, etc.) delete+reinsert por padre. Re-correr converge al mismo estado.
- `migration_log(run_id, source_doc, source_version, entidad, count_origen, count_destino, ts)` para trazabilidad.

## Mapeo store → tabla

| Origen (store) | Destino (tabla) | Notas de transformación |
|----------------|-----------------|-------------------------|
| `users` | `users` (+ `auth_user`) | `id` = email; sin password → set-password en 1er login |
| `products` | `products` | `creado`→`creado_at`, `modificado`→`modificado_at` |
| `warehouses` | `warehouses` | `esServicios`→`es_servicios` |
| `groups` | `groups` | `nombre` PK |
| `productTypes` | `product_types` | — |
| `providers` / `customers` | `providers` / `customers` | normalizar RUT (`codigo`=sin DV) |
| `costCenters` | `cost_centers` | — |
| `movements` | `movements` + `movement_lines` | **`detalles[]` → `movement_lines`**; `tipo`→`direccion`; `bodegaDestinoId`→`bodega_destino_id` |
| `stock` | `stock` | `key` se descarta (PK compuesta); **recalcular post-carga** y validar contra el crudo |
| `lots` | `lots` | `fechaVenc`→`fecha_venc`; conservar `id` origen (`lot\|...`) por referencias |
| `inventoryCounts` | `inventory_counts` + `inventory_count_lines` | **`lineas[]`** (¡no `detalles`!) |
| `mantenciones` | `maintenance_orders` + `maintenance_order_lines` | `_mod`→`updated_at` |
| `conteos` | `conteos` | `_mod`→`updated_at`; `arboles`→jsonb |
| `estimaciones` | `estimaciones` | — |
| `invplantas` | `invplantas` | `plantas[]`→jsonb; estados `sano\|debil\|muerto\|replante\|falta` |
| `audit` | `audit` | — |
| `config` | `config` (jsonb) + `counters` | separar contadores/`productCounter` a `counters` |
| (cuaderno) `panos` | `panos` | — |
| (cuaderno) `registros` | `field_records` | un registro por paño (`pano_id` directo) |
| (cuaderno) `ordenes` | `application_orders` | `productos[]/distribucion/objetivos`→jsonb; `pano_ids`→`text[]` |
| (cuaderno) `fertirriego` | `fertirriego_*` | sectores/órdenes/config |

## Orden de inserción (respeta FKs)

1. `product_types`, `groups`
2. `warehouses`
3. `providers`, `customers`, `cost_centers`
4. `products`
5. `users` (+ `auth_user`)
6. `counters` (sembrados desde config + recálculo del max real usado)
7. `config` (jsonb)
8. `maintenance_orders` → `maintenance_order_lines`
9. `movements` → `movement_lines` (`origen_mantencion` y `bodega_destino_id` ya tienen destino)
10. `lots`
11. `inventory_counts` → `inventory_count_lines`
12. `panos`
13. `field_records`, `application_orders`, `conteos`, `invplantas`, `estimaciones`, `fertirriego_*`
14. `audit`
15. **Recalcular `stock` desde `movement_lines`** (PPP); no migrar `stock` crudo, usarlo solo para validar

## Transformaciones de tipos

- **Fechas string → timestamptz/date**: ISO con hora → `timestamptz`; "YYYY-MM-DD" → `date`. Inválida → `null` + cuarentena/log.
- **`_mod` (epoch ms) → `updated_at`**: `new Date(_mod)`; si falta, `creado_at` o `now()`.
- **Numéricos**: Drizzle espera string para `numeric` → `String(Number(x)||0)`. Cantidades `numeric(18,4)`, costos `numeric(18,6)`.
- **Booleans con default "ausente=true"**: respetar `inventariable !== false`, `aplicaIVA !== false`.
- **Huérfanos**: línea con `codigoInterno` inexistente → insertar producto placeholder `activo=false` ("[MIGRADO-HUÉRFANO]") y registrar; nunca abortar el lote.

## Validación de integridad (`validate`)

1. **Conteos por entidad**: `len(payload.<store>)` == `count(*)` en la tabla destino.
2. **Conteo de líneas**: `sum(movements.detalles.length)` == `count(*) movement_lines`.
3. **Prueba dura (PPP)**: stock recalculado desde `movement_lines` == `stock` crudo del origen por `(codigo_interno, bodega_id)`, tolerancia ±0.0001. Diferencias = inconsistencias preexistentes → documentar, no "arreglar" en silencio.
4. **FKs huérfanas**: 0 líneas apuntando a placeholders; listar.
5. **Correlativos**: `max(numero por prefijo)` ≤ `counters.valor`.
6. **RUT**: validar DV; reportar inválidos sin abortar.

## Cutover sugerido

1. Congelar la app origen (solo lectura / aviso).
2. Forzar último sync de cada dispositivo a Firestore.
3. `fetch` baja los 3 docs + versión.
4. Migrar en staging Railway; `validate`; revisar diffs de stock/conteos.
5. Migrar en prod Railway; `validate`; recalcular stock; sembrar `counters`.
6. Invitar a usuarios a set-password; abrir app nueva.
7. Conservar dump Firestore + `migration_log` como evidencia de auditoría.

## Referencias en el monolito

- `index.html:1717-1736` — STORES y keypaths
- `index.html:4198-4430` — PPP/recálculo (réplica en `validate` y `ppp.ts`)
- `index.html:2402-2420` — 11 tipos de movimiento
- `index.html:12468, 12933` — objeto `S` y payload del cuaderno
