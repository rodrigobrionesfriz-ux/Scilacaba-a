// Constantes compartidas por los maestros (regla 7). Hoja: no importa otras capas.

// Opciones del filtro por estado (activo) de las tablas de maestros.
export const FILTRO_ESTADO = [
  { value: "todos", label: "Todos" },
  { value: "activos", label: "Activos" },
  { value: "inactivos", label: "Inactivos" },
] as const
