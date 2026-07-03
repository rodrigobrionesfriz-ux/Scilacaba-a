// Resultado de una acción de exportación (Excel/PDF): el servidor genera el
// archivo y lo devuelve como base64; el cliente lo decodifica a Blob y descarga.
export type ExportResult =
  | { ok: true; base64: string; filename: string }
  | { ok: false; error: string }

// Especificación de una hoja de un libro Excel, agnóstica de exceljs.
export type HojaExcel = {
  nombre: string
  columnas: { header: string; key: string; width?: number }[]
  filas: Record<string, unknown>[]
}
