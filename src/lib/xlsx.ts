import ExcelJS from "exceljs"
import type { HojaExcel } from "@/types/export.types"

// Construye un libro Excel a partir de una o más hojas (columnas + filas) y lo
// devuelve como base64. Único punto que toca exceljs; los export de cada
// entidad solo preparan filas y delegan aquí. La primera fila (cabecera) se
// pone en negrita.
export const construirExcel = async (hojas: HojaExcel[]): Promise<string> => {
  const libro = new ExcelJS.Workbook()
  for (const hoja of hojas) {
    const ws = libro.addWorksheet(hoja.nombre)
    ws.columns = hoja.columnas
    ws.addRows(hoja.filas)
    ws.getRow(1).font = { bold: true }
  }
  const buffer = await libro.xlsx.writeBuffer()
  return Buffer.from(buffer).toString("base64")
}
