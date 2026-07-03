# Módulo: Reportes (Excel / PDF transversales)

**Fase**: 10 · **Estado**: HECHO (código + tests; e2e/manual por el usuario pendiente)
**Ubicación**: capacidades transversales — `src/lib/xlsx.ts`, `src/lib/descarga.ts`, `src/server/reportes/`, `src/components/ui/exportar-{excel,pdf}.tsx`

## Alcance (qué replica del original)

Consolida la exportación diferida a lo largo de las Fases 3–9 y añade los reportes PDF.

- **Excel** (server-side con `exceljs` → base64 → descarga en cliente): Productos, Bodegas, Proveedores, Clientes, Centros de Costo, Tomas, Movimientos, Stock. Suma a los ya existentes (Mantenciones, Estimación), ahora todos sobre el mismo helper.
- **PDF** (server-side con `@react-pdf/renderer` → base64 → descarga; ADR-015):
  - **Inventario de Huerto — Resumen por cuartel** (Terreno/invplantas review). Monolito: `ipImprimirDetalleEstado` (`index.html:11075`).
  - **Cuaderno de Campo — Aplicaciones confirmadas** (Cuaderno/confirmaciones). Monolito: `imprimirAplicacionesPano` (`index.html:14790`).
  - **Control de Presupuesto — Reporte Gerencial** (KPIs + Top Desviaciones). Monolito: `imprimirPDF` (`index.html:18703`).
- **NO cubre**: gráficos dentro del PDF de presupuesto (`recharts` no renderiza en react-pdf → reporte tabular). El monolito imprimía la vista con gráficos vía `window.print()`; v2 genera el PDF en servidor (ADR-015). Los reportes PDF se anclan a las pantallas/datos que existen en v2 (resumen por cuartel y lista de confirmaciones), no a las vistas exactas del monolito (detalle por estado / agrupado por cuartel), que v2 no tiene.

## Modelo de datos

Sin tablas nuevas ni migración. Todo es lectura sobre datos existentes.

## Server Actions

| Action | Entrada (zod) | Permiso | Efectos | Devuelve |
|--------|---------------|---------|---------|----------|
| `exportar{Productos,Bodegas,Proveedores,Clientes,CentrosCosto}Excel` | — | `<entidad>.ver` / `centrosCosto.ver` | — (lectura) | `ExportResult` |
| `exportarTomasExcel` | — | `tomas.ver` | — | `ExportResult` |
| `exportarMovimientosExcel` | — | `movimientos.ver` | — | `ExportResult` |
| `exportarStockExcel` | — | `stock.ver` | — | `ExportResult` |
| `exportarResumenInvplantasPdf` | — | `invplantas.ver` | — | `ExportResult` |
| `exportarAplicacionesConfirmadasPdf` | — | `cuaderno.ver` | — | `ExportResult` |
| `exportarPresupuestoPdf` | `presupuestoPdfSchema` (`{moneda, filtros}`) | `presupuesto.ver` | — | `ExportResult` |

`ExportResult = { ok:true; base64; filename } | { ok:false; error }` (`src/types/export.types.ts`).

## Lógica / infra compartida

- `src/lib/xlsx.ts` — `construirExcel(hojas[])`: único punto que toca `exceljs` (columnas/filas/anchos → base64, cabecera en negrita). Los export solo preparan filas. **Testeado**.
- `src/lib/descarga.ts` — `descargarArchivo(base64, filename, mime)`: cliente, base64 → Blob → `<a download>`. Reusado por Excel y PDF.
- `src/constants/export.constants.ts` — `XLSX_MIME`, `PDF_MIME`, `EMPRESA_NOMBRE`.
- `src/utils/reportes.utils.ts` — puros/testeados: `fmtMoneda`/`fmtPct`/`fmtNumero`, `totalesResumenInvplantas`.
- `src/server/reportes/*.pdf.tsx` — documentos react-pdf (arrow, 1 comp/archivo) + `reporte-layout.pdf.tsx` (wrapper Document/Page + cabecera + `StyleSheet` compartido). Viven en `server` porque los actions no pueden importar `components` (ADR-013).
- El PDF de presupuesto **recomputa** KPIs/desviaciones en el servidor con `filtrarFilas`/`calcularKpis`/`topDesviaciones` (mismos utils puros del dashboard) a partir de `{moneda, filtros}` → refleja la vista en pantalla sin re-derivar en cliente.

## UI

- `ExportarExcel` / `ExportarPdf` (`src/components/ui/`): botones genéricos que reciben `action` y descargan. Montados en el slot `acciones` de `DataTableToolbar` (maestros, confirmaciones) o en el header de la vista (mantenciones, tomas, movimientos, stock, invplantas resumen).
- `presupuesto.exportar-pdf.tsx`: variante que pasa `moneda`+`filtros` del dashboard.

## Reglas de negocio (lo no obvio)

- `renderToBuffer` exige `ReactElement<DocumentProps>`; `JSX.Element` (= `ReactElement<any,any>`) es asignable → se tipa el helper `aBase64` sin `as`.
- `reportes.actions.tsx` es `.tsx` (JSX en la server action); solo exporta funciones async.
- `xlsx`/SheetJS sigue descartado (ReDoS, Fase 7c); `@react-pdf/renderer` verificado con `pnpm audit --prod` sin vulnerabilidades nuevas.

## Checklist de verificación end-to-end

- [ ] Export Excel de cada maestro/tomas/movimientos/stock descarga un `.xlsx` con las columnas correctas.
- [ ] Botón export no rompe el filtrado/orden de la tabla.
- [ ] PDF resumen invplantas (rol con `invplantas.revisar`) abre y muestra el resumen por cuartel + totales.
- [ ] PDF aplicaciones confirmadas (rol con `cuaderno.ver`) lista las confirmaciones.
- [ ] PDF presupuesto respeta la moneda (CLP/USD) y los filtros activos del dashboard.
- [ ] Permiso: rol sin el permiso de la entidad no ve el botón / la action rechaza.
- [ ] Tests unit (`xlsx`, `reportes.utils`) y smoke de render PDF verdes.

## Evidencia de verificación

- `pnpm typecheck` ✓ · `pnpm lint` ✓ · `pnpm test` **262 tests** ✓ · `pnpm build` ✓ (SW: 69 precache entries, 2569.98 KiB). e2e/manual por el usuario pendiente.
