# Módulo: Presupuesto (Dashboard Gerencial)

**Fase**: 9 · **Estado**: HECHO (código + tests; e2e/manual por el usuario pendiente)
**Ubicación**: `src/app/(app)/presupuesto/`, `src/server/presupuesto/`, `src/utils/presupuesto.utils.ts`

## Alcance (qué replica del original)

Reescritura del **Dashboard Gerencial de Control de Presupuesto** del monolito
(`index.html:3521-3959` render + `__PZ_BOOTSTRAP__` `18545-20360` lógica):

- **Toggle de moneda CLP/USD** (`index.html:18550`) que recalcula KPIs, gráficos y montos.
- **Filtros**: temporada, mes, tipo de costo, sub-grupo, descripción (`index.html:19186`).
- **Fila de KPIs**: Presupuesto total, Real acumulado, Desviación ($ y %), Meses con real,
  Mayor sobreejecución, Avance ejecución (`index.html:19250-19282`).
- **5 gráficos (recharts)**: evolución mensual (línea), por tipo de costo (barras), donut por
  sub-grupo (real acumulado), por descripción top 15 (barras), desviación por descripción (barras;
  clic → detalle).
- **Tabla Top Desviaciones** (top 8 por magnitud, clic → detalle) (`index.html:19857`).
- **Modal Detalle de Gastos**: ítems de la hoja "Detalle Gastos" agrupados por FAMILIA, búsqueda,
  pie Gasto/Ppto/Desv% (`index.html:18584-18700`).
- **Importación de Excel** ("Actualizar datos") que **reemplaza todo el dataset**
  (`index.html:18840-19023`), permiso `presupuesto.editar`.
- **Criterios por Temporada**: CRUD de criterios (poda/nutrición/M.O. …) por temporada
  (`index.html:3583-3617` + `20274-20360`).

**NO cubre** (fuera de alcance de Fase 9): impresión a PDF (Fase 10, `@react-pdf/renderer`);
export a Excel (el monolito de presupuesto no exporta, solo imprime PDF); el `/dashboard` global
placeholder (fase futura).

## Modelo de datos (tablas Drizzle)

Sin migración nueva (todo ya migrado en Fase 1):

- `budget_rows` (`src/db/schema/presupuesto.ts`): merge PPTO+REAL por mes/rubro. PK sintética `id`
  serial; `pptoClp/realClp/pptoUsd/realUsd` `numeric(18,4)`; `mesOrder` (mayo→abril).
- `budget_meta` (singleton `id="main"`): `monthsWithReal` text[], `kpis` jsonb `{kg,tc,ha,kgEst}`,
  `detalle` jsonb (por FAMILIA), `updatedAt`.
- `config` (fila `clave="pz_criterios"`, `valor` jsonb `{ key, items[], _updatedAt }`): **los
  criterios viven aquí** (no tienen tabla propia). Shape verbatim del monolito.

## Server Actions / Queries (`src/server/presupuesto/`)

| Fn | Entrada | Permiso | Efectos | Revalida |
|----|---------|---------|---------|----------|
| `getPresupuesto` (query) | — | `presupuesto.ver` | lee `budget_rows` (montos→number) + `budget_meta` | — |
| `getCriterios` (query) | — | `presupuesto.ver` | lee `config.pz_criterios` | — |
| `importarPresupuestoExcel` | base64 (.xlsx) | `presupuesto.editar` | parsea hoja "Base" + "Detalle Gastos"; `delete` + `insert` `budget_rows`; upsert `budget_meta` | `/presupuesto` |
| `guardarCriterio` | `criterioSchema` | `presupuesto.editar` | crea/edita item en `config.pz_criterios` | `/presupuesto` |
| `eliminarCriterio` | `id` | `presupuesto.editar` | quita item de `config.pz_criterios` | `/presupuesto` |

## Lógica de dominio (`src/utils/presupuesto.utils.ts`, pura + testeada)

- `montoPpto/montoReal(row, moneda)`, `filtrarFilas`, `calcularKpis`, `serieMensual`,
  `porTipoCosto`, `porSubGrupo`, `porDescripcion`, `desviacionPorDescripcion`, `topDesviaciones`,
  `opcionesFiltro`, `detalleDeDescripcion`.
- `indiceMes` (orden mayo→abril), `temporadaDeMesAnio` (mayo..dic→año; ene..abr→año-1).
- `construirFilasDesdeExcel(headers, filas)`: parseo/merge puro del Excel (split PPTO/REAL, clave
  `MES|AÑO|SUB|TIPO|DESC`, USD explícito o derivado por TC, `monthsWithReal`, TC del último mes).
- Narrowing sin `as` de los blobs jsonb: `narrowDetalle`, `narrowKpisMeta`, `narrowCriterios`.

## Reglas de negocio (lo no obvio)

- **Importar = reemplazar todo** (modelo del monolito): `delete` de `budget_rows` + insert.
  Salvaguarda: si el Excel no produce filas válidas, la action **aborta** (no vacía los datos).
- **Columna de presupuesto**: el monolito detecta "PPTO AJUSTADO KG" pero es **código muerto**
  (`index.html:18872`, nunca usado); el merge siempre lee "MONTO PPTO" → lo replicamos para
  reproducir los datos ya migrados.
- **Agregación reactiva en cliente**: el server entrega el dataset crudo; los KPIs/series se
  recalculan en el cliente por moneda/filtros vía las utils puras (misma fuente de verdad).
- **Detalle en CLP**: los montos de la hoja Detalle Gastos están en CLP; en modo USD se dividen
  por el TC (`budget_meta.kpis.tc`).

## UI (`(sections)/`)

`page.tsx` → `presupuesto.view.tsx` (server; `Tabs` Dashboard/Criterios + `presupuesto.import`).
Dashboard (client, orquestador): `presupuesto.dashboard.tsx` compone `.filtros`, `.kpis`,
`.chart-mensual/.chart-tipo/.chart-subgrupo/.chart-descripcion/.chart-desviacion`,
`.top-desviaciones` y `.detalle-modal`. Pestaña Criterios: `presupuesto.criterios.tsx`.

## Dependencias nuevas

- `recharts` 3.8.0 + `src/components/ui/chart.tsx` y `src/components/ui/tabs.tsx` (shadcn,
  vía `pnpm dlx shadcn add tabs chart`). Primer módulo con gráficos.

## Checklist de verificación end-to-end

- [ ] `gerente`/`admin` → sidebar "Control de Presupuesto" → `/presupuesto` carga con las 372 filas
      migradas; KPIs + 5 gráficos + top desviaciones + filtros responden.
- [ ] Toggle CLP/USD cambia todos los montos.
- [ ] Clic en barra de desviación / fila del top → abre el modal Detalle de Gastos con búsqueda.
- [ ] `presupuesto.editar`: subir un `.xlsx` (hoja "Base") → dataset reemplazado, KPIs recomputados;
      subir un archivo inválido → error, datos intactos.
- [ ] Criterios: crear/editar/eliminar → persiste en `config.pz_criterios` y sobrevive al recargar;
      rol sin `presupuesto.editar` lo ve solo-lectura.
- [ ] Rol sin `presupuesto.ver` → redirigido a `/dashboard`.
- [ ] typecheck/lint/tests/build verdes.

## Evidencia de verificación

- typecheck/lint verdes; **247 tests** verdes (25 nuevos: utils + schema); `pnpm build` verde
  (SW: 70 precache entries, 2557 KiB). e2e/manual por el usuario pendiente.
