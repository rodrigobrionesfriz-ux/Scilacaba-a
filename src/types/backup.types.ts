// Respaldo JSON de dominio (ADR-017). `tablas` mapea nombre de tabla → filas.
export type BackupPayload = {
  version: number
  fecha: string
  tablas: Record<string, unknown[]>
}
