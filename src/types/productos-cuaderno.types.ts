// Fila del catálogo de productos del cuaderno: forma plana de `field_products`
// (PK = nombre). El tipo `ProductoCuaderno` (z.infer del input) vive en
// src/schemas/productos-cuaderno.schema.ts.
export type ProductoCuadernoRow = {
  nombre: string
  tipo: string
  unidad: string
  dosis: string
  ingredienteActivo: string
  objetivo: string
}
