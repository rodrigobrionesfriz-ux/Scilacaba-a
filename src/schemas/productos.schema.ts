import { z } from "zod"
import { UNIDADES_MEDIDA } from "@/constants/productos.constants"

// Input del formulario de Producto (regla 13). `codigoInterno` se autogenera al
// crear (correlativo), por eso no está en el input. En edición se pasa aparte.
export const productoSchema = z.object({
  descripcion: z.string().trim().min(1, "La descripción es obligatoria"),
  unidadMedida: z.enum(UNIDADES_MEDIDA, {
    message: "Selecciona una unidad de medida",
  }),
  tipoProducto: z.string().trim().min(1, "Selecciona un tipo de producto"),
  grupo: z.string().trim().min(1, "Selecciona un grupo"),
  subGrupo: z.string().trim().default(""),
  codigoEan: z.string().trim().default(""),
  manejaAtributos: z.boolean().default(false),
  inventariable: z.boolean().default(true),
  stockMinimo: z.coerce
    .number({ message: "El stock mínimo debe ser un número" })
    .min(0, "El stock mínimo no puede ser negativo")
    .default(0),
  aplicaIva: z.boolean().default(true),
  aplicaIec: z.boolean().default(false),
  aplicaIla: z.boolean().default(false),
  ccTipo: z.string().trim().default(""),
  ccIngredienteActivo: z.string().trim().default(""),
  ccObjetivo: z.string().trim().default(""),
  ccDosis: z.coerce.number().min(0).nullable().default(null),
  ccUnidad: z.string().trim().default(""),
  activo: z.boolean().default(true),
})

// Output validado del formulario (los tipos z.infer viven junto al schema para
// respetar boundaries: types no puede importar schemas).
export type Producto = z.infer<typeof productoSchema>
