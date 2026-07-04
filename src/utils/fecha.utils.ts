// Formatea una fecha ISO a "dd-mm-aaaa hh:mm" (es-CL). "" si no es parseable.
// Usado por la auditoría (tabla y export); parte pura sin dependencias de capa.
export const fmtFechaHora = (iso: string): string => {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
