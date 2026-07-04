// Fila de auditoría para la vista de lectura (todos los campos ya normalizados a
// string; los NULL migrados se resuelven a "" en la query). Origen: tabla audit.
export type AuditRow = {
  id: string
  fecha: string // ISO 8601
  usuario: string
  accion: string
  detalle: string
  referencia: string
}

// Campos de dominio de una entrada nueva de auditoría. El id y la fecha los pone
// el core al insertar (crypto.randomUUID + new Date), no la parte pura.
export type NuevaEntradaAudit = {
  usuario: string
  accion: string
  detalle: string
  referencia: string
}
