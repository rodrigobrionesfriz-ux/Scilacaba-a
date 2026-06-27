// Fila del listado: forma plana de la tabla products (incluye PK). Se mantiene
// laxa (unidadMedida: string) para no romper el listado si la data migrada trae un
// valor fuera del enum; el enum solo se exige al validar el input del form. El tipo
// `Producto` (z.infer del schema) vive en src/schemas/productos.schema.ts.
export type ProductoRow = {
  codigoInterno: string
  descripcion: string
  unidadMedida: string
  tipoProducto: string
  grupo: string
  subGrupo: string
  codigoEan: string
  manejaAtributos: boolean
  inventariable: boolean
  stockMinimo: number
  aplicaIva: boolean
  aplicaIec: boolean
  aplicaIla: boolean
  ccTipo: string
  ccIngredienteActivo: string
  ccObjetivo: string
  ccDosis: number | null
  ccUnidad: string
  activo: boolean
}
