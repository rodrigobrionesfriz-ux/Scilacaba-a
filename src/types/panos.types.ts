// Fila del listado de paños: forma plana de la tabla `panos` (incluye PK). Se
// mantiene laxa para no romper el listado con data migrada. El tipo `Pano`
// (z.infer del input) vive en src/schemas/panos.schema.ts.
export type PanoRow = {
  id: number
  nombre: string
  variedad: string
  anio: string
  hectareas: number | null
  hasRiego: number | null
  densidad: number | null
  plantas: number | null
  color: string
}
