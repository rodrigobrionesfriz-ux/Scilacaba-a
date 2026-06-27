import { z } from "zod"

// Builders lenientes para campos crudos (no coercionan; eso es del transform).
const s = z.string().nullish()
const num = z.union([z.number(), z.string()]).nullish()
const bln = z.boolean().nullish()
const arrS = z.array(z.string()).nullish()
// Blobs legacy heterogéneos: se preservan verbatim (jsonb) → record laxo.
const rec = z.record(z.string(), z.unknown())

// --- Sub-objetos anidados ---
const detalleSchema = z.looseObject({
  codigoInterno: s,
  descripcion: s,
  unidadMedida: s,
  cantidad: num,
  costo: num,
  lote: s,
  fechaVenc: s,
  loteId: s,
})

const countLineaSchema = z.looseObject({
  codigoInterno: s,
  descripcion: s,
  unidadMedida: s,
  manejaAtributos: bln,
  loteId: s,
  lote: s,
  fechaVenc: s,
  teorico: num,
  costoTeorico: num,
  fisico: num,
  fisicoIngresado: bln,
  asumidoCero: bln,
})

const mantencionLineaSchema = z.looseObject({
  tipo: s,
  productoCodigo: s,
  productoNombre: s,
  detalle: s,
  cantidad: num,
  valorUnit: num,
})

// --- Stores (PK requerida donde es id estable) ---
const userSchema = z.looseObject({
  id: z.string(),
  nombre: s,
  role: s,
  permissions: arrS,
  activo: bln,
  creado: s,
  modificado: s,
})

const productSchema = z.looseObject({
  codigoInterno: z.string(),
  codigoEAN: s,
  descripcion: s,
  unidadMedida: s,
  tipoProducto: s,
  grupo: s,
  subGrupo: s,
  manejaAtributos: bln,
  inventariable: bln,
  stockMinimo: num,
  aplicaIVA: bln,
  aplicaIEC: bln,
  aplicaILA: bln,
  ccTipo: s,
  ccIngredienteActivo: s,
  ccObjetivo: s,
  ccDosis: num,
  ccUnidad: s,
  activo: bln,
  creado: s,
  modificado: s,
})

const warehouseSchema = z.looseObject({
  id: z.string(),
  nombre: s,
  direccion: s,
  esServicios: bln,
  activo: bln,
  creado: s,
})
const groupSchema = z.looseObject({ nombre: z.string(), subgrupos: arrS })
const productTypeSchema = z.looseObject({
  nombre: z.string(),
  descripcion: s,
  activo: bln,
  creado: s,
  modificado: s,
})

// providers y customers comparten forma
const entidadComercialSchema = z.looseObject({
  codigo: s,
  razonSocial: s,
  rut: s,
  giro: s,
  direccion: s,
  comuna: s,
  ciudad: s,
  telefono: s,
  email: s,
  contacto: s,
  activo: bln,
  creado: s,
  modificado: s,
})

const costCenterSchema = z.looseObject({
  codigo: s,
  descripcion: s,
  area: s,
  responsable: s,
  observaciones: s,
  activo: bln,
  creado: s,
  modificado: s,
})

const movementSchema = z.looseObject({
  numero: z.string(),
  tipo: s,
  tipoMovimiento: s,
  fecha: s,
  bodegaId: s,
  bodegaDestinoId: s,
  documento: s,
  tipoDoc: s,
  numeroDoc: s,
  proveedorCodigo: s,
  clienteCodigo: s,
  centroCosto: s,
  observaciones: s,
  detalles: z.array(detalleSchema).nullish(),
  usuario: s,
  autorizadoPor: s,
  tomaId: s,
  tomaNumero: s,
  anulado: bln,
  creado: s,
  _mod: num,
})

const stockSchema = z.looseObject({
  key: s,
  codigoInterno: s,
  bodegaId: s,
  cantidad: num,
  costoPromedio: num,
})
const lotSchema = z.looseObject({
  id: z.string(),
  codigoInterno: s,
  bodegaId: s,
  lote: s,
  fechaVenc: s,
  cantidad: num,
  costo: num,
})

const inventoryCountSchema = z.looseObject({
  id: z.string(),
  numero: s,
  bodegaId: s,
  estado: s,
  alcance: s,
  filtroGrupo: s,
  filtroTipo: s,
  observaciones: s,
  lineas: z.array(countLineaSchema).nullish(),
  usuario: s,
  creado: s,
  autorizado: s,
  autorizadoPor: s,
  aplicado: s,
  movimientosGenerados: arrS,
  devolucionMotivo: s,
})

const mantencionSchema = z.looseObject({
  id: z.string(),
  numero: s,
  fecha: s,
  categoria: s,
  activo: s,
  descripcion: s,
  proveedorCodigo: s,
  lineas: z.array(mantencionLineaSchema).nullish(),
  total: num,
  estado: s,
  factura: rec.nullish(),
  creado: s,
  modificado: s,
  _mod: num,
})

const conteoSchema = z.looseObject({
  id: z.string(),
  panoId: num,
  panoNombre: s,
  variedad: s,
  especie: s,
  etapa: s,
  fijosCodigos: arrS,
  fechaInicio: s,
  fechaFin: s,
  usuario: s,
  arboles: z.array(rec).nullish(),
  promedioCentros: num,
  nArboles: num,
  sincronizado: bln,
  fechaSync: s,
  _mod: num,
})

const invplantaSchema = z.looseObject({
  id: z.string(),
  cuartelId: num,
  cuartel: s,
  variedad: s,
  portainjerto: s,
  polinizante: s,
  hilera: s,
  codigoBase: s,
  fechaInicio: s,
  usuario: s,
  countPrincipal: num,
  countPoliniz: num,
  secuencia: z.array(z.unknown()).nullish(),
  gpsInicio: rec.nullish(),
  gpsFin: rec.nullish(),
  plantas: z.array(rec).nullish(),
  sincronizado: bln,
  fechaSync: s,
  _mod: num,
})

const estimacionSchema = z.looseObject({
  id: z.string(),
  nombre: s,
  fecha: s,
  usuario: s,
  lineas: z.array(rec).nullish(),
  totalKg: num,
  modificado: s,
  _mod: num,
})

const auditSchema = z.looseObject({
  id: z.string(),
  fecha: s,
  usuario: s,
  accion: s,
  detalle: s,
  referencia: s,
})

// --- Envelope del doc sci/main (payload ya JSON.parseado) ---
export const sciPayloadSchema = z.looseObject({
  users: z.array(userSchema).optional(),
  products: z.array(productSchema).optional(),
  warehouses: z.array(warehouseSchema).optional(),
  groups: z.array(groupSchema).optional(),
  productTypes: z.array(productTypeSchema).optional(),
  providers: z.array(entidadComercialSchema).optional(),
  customers: z.array(entidadComercialSchema).optional(),
  costCenters: z.array(costCenterSchema).optional(),
  inventoryCounts: z.array(inventoryCountSchema).optional(),
  movements: z.array(movementSchema).optional(),
  mantenciones: z.array(mantencionSchema).optional(),
  conteos: z.array(conteoSchema).optional(),
  estimaciones: z.array(estimacionSchema).optional(),
  invplantas: z.array(invplantaSchema).optional(),
  stock: z.array(stockSchema).optional(),
  lots: z.array(lotSchema).optional(),
  audit: z.array(auditSchema).optional(),
  config: z.array(z.looseObject({ key: z.string() })).optional(),
})

export type SciPayload = z.infer<typeof sciPayloadSchema>
