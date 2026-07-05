# Análisis de brechas — monolito actualizado (`origin/main`) vs SCI v2

**Fecha**: 2026-07-04 · **Fuente**: `git diff develop origin/main -- index.html` (+1340/−158, ~2286 líneas de diff).

## Contexto

v2 se construyó replicando la versión del monolito que vive en `develop:index.html`. El
monolito siguió evolucionando y esos cambios están en `origin/main:index.html`. Por tanto
**la brecha ≈ el diff `develop → main`**. Este documento cataloga cada funcionalidad
nueva/cambiada y si v2 la cubre, con tamaño y capas a tocar. Líneas citadas = `origin/main`.

> Nota de terminología: en el monolito el prefijo `cc*` = **Cuaderno de Campo** (no Centros
> de Costo). Los "equipos" nuevos son **nebulizadoras** de las órdenes de aplicación.

## Resumen priorizado

| # | Ítem | Tipo | v2 | Tamaño | Prioridad |
|---|------|------|----|--------|-----------|
| 1 | Dashboard real (reemplazar stub) | core | ❌ stub | Mediano | **P1** |
| 2 | Movimientos: ocultar anulados por defecto | comportamiento | ❌ | Chico | **P1** |
| 3 | `fmtQty`: siempre kg/L, 2 decimales | comportamiento | ⚠️ verificar | Chico | **P1** |
| 4 | Normalización global a MAYÚSCULAS en inputs | transversal | ❌ | Chico-Med | **P1** |
| 5 | Compra Urgente (dashboard + cuaderno) | módulo nuevo | ❌ | Mediano | **P2** |
| 6 | Gestión de Equipos / nebulizadoras + nº estanques | módulo nuevo | ❌ | Chico-Med | **P2** |
| 7 | Presupuesto: detalle por temporada | mejora | ⚠️ parcial | Chico-Med | **P2** |
| 8 | Stock: búsqueda en catálogo completo + filas "Sin existencias" | comportamiento | ❌ | Chico-Med | **P2** |
| 9 | `viewProduct`: historial de movimientos con saldo acumulado | mejora | ❌ | Chico-Med | **P2** |
| 10 | Fertirriego: `frImprimirOrden` + sectores↔paños + distribución por paño | mejora | ❌ parcial | Med-Grande | **P3** |
| 11 | `verAplicacionesPano`: prorrateo por há + N° confirmación + equipo | mejora | ❌ | Chico-Med | **P3** |
| 12 | Dedup/limpieza de productos (fusión + normalización) | herramienta admin | ❌ | Mediano | **P3** |
| 13 | Gating de tablas por filtro (prov/cli/stock/mov) | transversal UX | ❌ | Mediano | **P4 (decidir)** |
| 14 | Polinizador + **mapa general** del huerto (invplantas) | mejora grande | ❌ | **Grande** | **P4** |

Leyenda: ❌ ausente · ⚠️ parcial. "Decidir" = puede no aplicar a v2 (ver nota).

---

## Detalle

### 1. Dashboard real (P1) — módulo core
El dashboard de v2 (`src/server/dashboard/dashboard.queries.ts`) es un **stub de Fase 0**
(devuelve `{0,0,0}`). El monolito (`renderDashboard`, main:4640+) muestra 6 KPIs
(productos, bodegas, valor inventario, movimientos, stock bajo, lotes por vencer),
movimientos recientes y acciones rápidas. **Cambios nuevos en main**:
- **Valor inventario separa servicios** (main:4667-4680, 4750-4757): `valorInv` excluye
  `inventariable===false`; nueva sub-línea "Servicios" (`valorServ`).
- **Columna "Producto"** en movimientos recientes (main:4780-4800).
- **Banner "Productos Compra Urgente"** (main:4706-4726) → depende del ítem 5.

Capas: `server/dashboard` (queries reales), `app/(app)/dashboard/(sections)`, `types`,
`constants`. El banner de Compra Urgente se difiere hasta implementar el ítem 5.

### 2. Movimientos: ocultar anulados por defecto (P1)
main:7958 filtra `!anulado` por defecto en la tabla de movimientos. v2 los muestra con
badge "Anulado" (`movimientos.columns.tsx`). Ajuste: filtro por defecto + toggle "ver
anulados".

### 3. `fmtQtyAuto`/`fmtQtyStr`: siempre kg/L, 2 decimales (P1)
main:16625-16656 reescribe la regla: g→kg, mL/cc→L, kg/L se mantienen; decimales 3→2.
Afecta toda la UI de órdenes del Cuaderno. **Verificar** `src/utils/fertirriego.utils.ts`
y alinear.

### 4. Normalización global a MAYÚSCULAS (P1) — transversal
main:~21545 inyecta CSS `text-transform:uppercase` + `change` handler que convierte a
MAYÚSCULAS todos los `input[type=text|search]`/`textarea`. Exclusiones: login,
password, email, url, `data-nouppercase`. v2 solo tiene `toUpperCase()` puntual. Opciones:
componente `<UppercaseInput>` compartido o normalización en los schemas zod (preferible por
capas — normaliza en submit, no solo visual).

### 5. Compra Urgente (P2) — módulo nuevo (ausente total en v2)
Al emitir una orden de aplicación, detecta productos cuyo stock no cubre lo requerido y los
acumula (`S.comprasUrgentes`, main:13046). Tarjeta en dashboard + Cuaderno + modal agrupado
por producto (`renderCompraUrgente`/`abrirCompraUrgente` main:14096-14163; `_stockProductoOrden`
main:16453). Sin nav propio.
Capas: `db/schema/cuaderno` (tabla `application_urgent_purchases` o `faltantes jsonb` en
`application_orders` + migración), `types`, `schemas`, `server/ordenes` (calcular faltantes
cruzando `server/stock`+`server/productos` al crear orden), nueva query agregada, `app`
(tarjeta dashboard + sección cuaderno).

### 6. Gestión de Equipos / nebulizadoras (P2) — módulo nuevo (ausente)
Catálogo `{nombre, capacidad}` (`S.equipos`, main:13046) usado en el formulario de orden
para elegir equipo y calcular `nEstanques = ceil(tAgua/capacidad)`. Orden guarda `equipo`,
`equipoCap`, `nEstanques`. CRUD en modal (`abrirGestionEquipos`, `ge*` main:16304-16347;
`ccRenderEquipoSelect`/`ccEquipoSel` main:16288-16303). **No** se relaciona con Mantenciones
(su `activo` es texto libre) ni con el catálogo de equipos de Fertirriego (distinto).
Capas: nueva entidad `equipos` (usar skill `new-entity`), columnas en `application_orders`,
integración en el formulario de orden + cálculo de estanques.

### 7. Presupuesto: detalle por temporada (P2) — parcial
main migra el blob `DETALLE_GASTOS` de plano `{familia:[items]}` a segmentado
`{temporada:{familia:[items]}}` (`_isSeasonDetalle`/`_toSeasonDetalle`/`_getDetalleFamilia`
main:19618-19680) y el modal de detalle filtra por la temporada del dashboard. v2
(`presupuesto.utils.ts` `detalleDeDescripcion`, `presupuesto.dashboard.tsx`) usa el formato
plano y filtra solo por **mes**. También: columnas N°/Cantidad en el detalle; `processExcel`
segmenta por temporada (solo filas REAL) y `_getTemporada` deriva temporada de MES+AÑO.
Capas: `types` (+`temporada` en `DetalleGastoItem`), `utils` (narrow + `_toSeasonDetalle`
para compat con blobs viejos), `server/presupuesto` (`construirDetalle` segmentado), `app`
(pasar `filtros.temporada`).

### 8. Stock: búsqueda en catálogo completo + filas virtuales (P2)
main:7494-7560: al buscar, recorre TODO el catálogo (incluye saldo 0 o sin registro de
stock → fila "Sin existencias" fondo rojo), ignorando "solo con saldo". v2 `stock.table.tsx`
no lo hace. Capas: `server/stock` (query que una catálogo + stock), `app` (columna/estado).

### 9. `viewProduct`: historial de movimientos con saldo acumulado (P2)
main:5405-5449: la ficha de producto muestra el historial de movimientos con saldo
acumulado. v2 `productos.view` solo muestra resumen de stock. Capas: `server/productos`
(query de movimientos del producto), `app` (sección historial).

### 10. Fertirriego: impresión + sectores↔paños + distribución por paño (P3)
`frImprimirOrden` (main:14888-14996): documento imprimible con distribución por paño,
aportes nutricionales y **firmas** (Preparado/Aplicado/Supervisado). Además los sectores
pueden asociarse a paños (`sector.panos[]`, main:14479-14535): superficie y distribución se
calculan **por paño** (con `has_riego`), dosis por hectárea. v2 tiene solo vista en pantalla
(`oaf.detalle.tsx`) sobre el total de la orden; `SectorRow` no tiene `panos`.
Capas: `types` (+`panos` en sector), `utils/fertirriego` (distribución por paño), `server`
(query con paños), `server/reportes` (PDF orden), `app` (botón imprimir).

### 11. `verAplicacionesPano`: prorrateo por paño (P3)
main:15543-15580: el reporte de aplicaciones por paño muestra solo lo aplicado en ese paño,
prorrateando por (há del grupo / há total); añade N° de confirmación y equipo. v2 no tiene
este reporte con prorrateo.

### 12. Dedup / limpieza de productos (P3) — herramienta admin
main:5190-5388: agrupa productos por nombre normalizado, elige ganador por prioridad
(más movimientos → mayor completitud → tiene stock → más antiguo), fusiona campos vacíos,
reasigna stock/lotes/movimientos y elimina perdedores; normaliza todo a MAYÚSCULAS. Preview
no destructivo (`previewLimpiezaProductos`) + aplicación (`aplicarLimpiezaProductos`).
Gated por `productos.eliminar`. Capas: `server/productos` (análisis + fusión transaccional),
`app/(app)/productos` o `config` (preview + confirmación).

### 13. Gating de tablas por filtro (P4 — decidir si aplica)
main exige buscar/filtrar antes de listar (empty-state con contador) en Proveedores/
Clientes/Stock/Movimientos (main:5868/6068/7494/7945). Era para no renderizar miles de filas
client-side. **v2 usa `DataTable` con paginación server-friendly**, así que puede no ser
necesario; decidir si se adopta como UX o se omite.

### 14. Polinizador + mapa general del huerto (P4) — GRANDE
El "mapa general del cuartel" (SVG por hileras) **ya faltaba en v2 desde develop** (v2 solo
tiene el mapa 2D por hilera, `invplantas.map.tsx`). main añade encima: color por variedad
polinizante (`ipColorPoliniz`: Skeena rojo/Kordia azul/otros naranja, main:10709), detalle
de polinizantes agrupado (`ipDetallePoliniz`), edición masiva por hilera
(`ipEditarPolinizMasivo`/`ipGuardarPolinizMasivo`), impresión del detalle y del mapa
(main:11439-11705), reorientación SUR/NORTE del SVG, y cambios de colores de estados
(`IP_ESTADOS`). Capas: UI (mapa general SVG + modales), `utils/invplantas`, `server/invplantas`
(edición masiva de `polinizante`), `server/reportes` (2 PDFs).

### Notas cruzadas
- Otros arreglos menores dentro de features conocidas: `renderOrdenChips` compara ids con
  `String()` (fix de selección de paños, main:16412), match flexible de productos en
  fertirriego (`frRenderLineas` main:14780), mensajes de error de `frGuardarOrden`, doble
  conversión de moneda en detalle de presupuesto (main:19764).
- Ninguna feature nueva agrega **nav de primer nivel**: todo se expone como tarjetas/modales
  dentro de vistas existentes.

## Datos: sin impacto
Firebase actual no tiene clientes (`customers: []`), consistente con `customers=0` en v2. No
es una brecha de código; es dato inexistente en el origen.
