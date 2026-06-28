import { z } from "zod"
import {
  METODOS_APLICACION,
  TIPOS_PRODUCTO,
  UNIDADES_DOSIS,
} from "@/constants/cuaderno.constants"

// Input del formulario de Aplicación (field_records, regla 13). El `id` es
// epoch-ms generado al crear. `dosis` se conserva como texto (el origen mezcla
// string/number). Campos obligatorios (*) según el monolito: fecha, paño, tipo,
// producto, método.
export const aplicacionSchema = z.object({
  fecha: z.string().trim().min(1, "La fecha es obligatoria"),
  panoId: z.coerce
    .number({ message: "Selecciona un paño" })
    .int()
    .positive("Selecciona un paño"),
  tipo: z.enum(TIPOS_PRODUCTO, { message: "Selecciona un tipo" }),
  producto: z.string().trim().min(1, "El producto es obligatorio"),
  dosis: z.string().trim().default(""),
  unidad: z.enum(UNIDADES_DOSIS).default("L/ha"),
  metodo: z.enum(METODOS_APLICACION, { message: "Selecciona un método" }),
  operador: z.string().trim().default(""),
  obs: z.string().trim().default(""),
  lote: z.string().trim().default(""),
})

export type Aplicacion = z.infer<typeof aplicacionSchema>
