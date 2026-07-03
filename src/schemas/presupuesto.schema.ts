import { z } from "zod"

// Validación de un criterio por temporada (regla 13). El id es opcional: presente
// al editar, ausente al crear (la action genera uno). Espeja pzGuardarCriterio
// (index.html:20279-20300): temporada, tipo y detalle son obligatorios.
export const criterioSchema = z.object({
  id: z.string().min(1).optional(),
  temporada: z.string().trim().min(1, "Seleccione una temporada"),
  tipo: z.string().trim().min(1, "Seleccione un tipo de gasto"),
  detalle: z.string().trim().min(1, "Describa el criterio"),
})

export type CriterioInput = z.infer<typeof criterioSchema>

// Id de un criterio a eliminar.
export const criterioIdSchema = z.object({ id: z.string().min(1) })
