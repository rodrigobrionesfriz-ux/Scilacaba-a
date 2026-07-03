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

// Payload del reporte PDF de presupuesto: la moneda activa y los filtros del
// dashboard. El servidor recomputa KPIs/desviaciones con esos filtros (misma
// lógica pura que el cliente) — así el PDF refleja la vista en pantalla.
export const presupuestoPdfSchema = z.object({
  moneda: z.enum(["CLP", "USD"]),
  filtros: z.object({
    temporada: z.string(),
    mes: z.string(),
    tipoCosto: z.string(),
    subGrupo: z.string(),
    descripcion: z.string(),
  }),
})

export type PresupuestoPdfInput = z.infer<typeof presupuestoPdfSchema>
