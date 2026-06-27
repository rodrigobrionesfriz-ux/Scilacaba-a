// Sub-catálogos consumidos por el formulario de Productos (selects). Su CRUD vive en
// Configuración (Fase 11); aquí solo se leen.
export type ProductType = { nombre: string; descripcion: string | null }
export type Group = { nombre: string; subgrupos: string[] }
