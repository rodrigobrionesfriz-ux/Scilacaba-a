import type { NuevaEntradaAudit } from "@/types/audit.types"

// Arma los campos de dominio de una entrada de auditoría (parte pura, sin I/O).
// El usuario ausente se registra como "system" (paridad con audit() del monolito,
// index.html:2483). El id y la fecha los añade el core al insertar.
export const construirEntradaAudit = (
  usuarioId: string | null | undefined,
  accion: string,
  detalle: string,
  referencia = "",
): NuevaEntradaAudit => ({
  usuario: usuarioId ?? "system",
  accion,
  detalle,
  referencia,
})
