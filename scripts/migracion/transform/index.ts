import { cuadernoPayloadSchema } from "@/schemas/firestore-cuaderno.schema"
import { presupuestoPayloadSchema } from "@/schemas/firestore-presupuesto.schema"
import { sciPayloadSchema } from "@/schemas/firestore-sci.schema"
import type { DocCrudo } from "../firebase"
import { transformCuaderno } from "./cuaderno"
import { transformInventario } from "./sci-inventario"
import { placeholderProducto, transformMaestros } from "./sci-maestros"
import { transformMantenciones } from "./sci-mantenciones"
import { buildCounters, transformSistema } from "./sci-sistema"
import { transformTerreno } from "./sci-terreno"
import { transformTomas } from "./sci-tomas"
import { transformPresupuesto } from "./presupuesto"

export type DocsCrudos = {
  sci: DocCrudo
  cuaderno: DocCrudo
  presupuesto: DocCrudo
}

// Orquesta el transform de los 3 docs Firestore → todas las filas de DB.
// Los huérfanos (códigos referidos por líneas de movimientos o tomas pero ausentes
// del catálogo) se cubren con un producto placeholder activo=false.
export const transformAll = (docs: DocsCrudos) => {
  const sciP = sciPayloadSchema.parse(docs.sci.payload ?? {})
  const cuaP = cuadernoPayloadSchema.parse(docs.cuaderno.payload ?? {})
  const presP = presupuestoPayloadSchema.parse(docs.presupuesto.payload ?? {})

  const maestros = transformMaestros(sciP)
  const inventario = transformInventario(sciP)
  const tomas = transformTomas(sciP)
  const proveedorCodigos = new Set(maestros.providers.map((p) => p.codigo))
  const mantenciones = transformMantenciones(sciP, proveedorCodigos)
  const terreno = transformTerreno(sciP)
  const sistema = transformSistema(sciP)
  const counters = buildCounters(sciP, cuaP)
  const cuaderno = transformCuaderno(cuaP)
  const presupuesto = transformPresupuesto(presP)

  const existentes = new Set(maestros.products.map((p) => p.codigoInterno))
  const referidos = new Set([...inventario.referidos, ...tomas.referidos])
  for (const cod of referidos) {
    if (!existentes.has(cod)) maestros.products.push(placeholderProducto(cod))
  }

  return {
    productTypes: maestros.productTypes,
    groups: maestros.groups,
    warehouses: maestros.warehouses,
    providers: maestros.providers,
    customers: maestros.customers,
    costCenters: maestros.costCenters,
    products: maestros.products,
    users: maestros.users,
    counters,
    config: sistema.config,
    maintenanceOrders: mantenciones.maintenanceOrders,
    maintenanceOrderLines: mantenciones.maintenanceOrderLines,
    movements: inventario.movements,
    movementLines: inventario.movementLines,
    inventoryCounts: tomas.inventoryCounts,
    inventoryCountLines: tomas.inventoryCountLines,
    panos: cuaderno.panos,
    fieldProducts: cuaderno.fieldProducts,
    fieldRecords: cuaderno.fieldRecords,
    applicationOrders: cuaderno.applicationOrders,
    applicationConfirmations: cuaderno.applicationConfirmations,
    conteos: terreno.conteos,
    invplantas: terreno.invplantas,
    estimaciones: terreno.estimaciones,
    fertirriegoSectores: cuaderno.fertirriegoSectores,
    fertirriegoOrdenes: cuaderno.fertirriegoOrdenes,
    fertirriegoConfig: cuaderno.fertirriegoConfig,
    budgetRows: presupuesto.budgetRows,
    budgetMeta: presupuesto.budgetMeta,
    audit: sistema.audit,
  }
}

export type FilasMigracion = ReturnType<typeof transformAll>
