// Fila del listado de aplicaciones: forma plana de `field_records` (incluye PK)
// con el nombre del paño resuelto para mostrar. El tipo `Aplicacion` (z.infer del
// input) vive en src/schemas/aplicaciones.schema.ts.
export type AplicacionRow = {
  id: number
  fecha: string
  panoId: number | null
  panoNombre: string
  tipo: string
  producto: string
  dosis: string
  unidad: string
  metodo: string
  operador: string
  obs: string
  lote: string
}
