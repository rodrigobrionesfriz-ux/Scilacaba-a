import { describe, expect, it } from "vitest"
import { construirExcel } from "@/lib/xlsx"

const esZipXlsx = (base64: string): boolean =>
  Buffer.from(base64, "base64").subarray(0, 2).toString() === "PK"

describe("construirExcel", () => {
  it("genera un base64 decodificable a un .xlsx (firma ZIP)", async () => {
    const base64 = await construirExcel([
      {
        nombre: "Hoja",
        columnas: [{ header: "Código", key: "codigo" }],
        filas: [{ codigo: "P-1" }],
      },
    ])
    expect(base64.length).toBeGreaterThan(0)
    // Los .xlsx son archivos ZIP → empiezan con "PK".
    expect(esZipXlsx(base64)).toBe(true)
  })

  it("maneja varias hojas (incluida una vacía) sin lanzar y produce un ZIP válido", async () => {
    const unaHoja = await construirExcel([
      { nombre: "H", columnas: [{ header: "X", key: "x" }], filas: [{ x: 1 }] },
    ])
    const variasHojas = await construirExcel([
      {
        nombre: "Productos",
        columnas: [
          { header: "Código", key: "codigo" },
          { header: "Activo", key: "activo" },
        ],
        filas: [
          { codigo: "P-1", activo: "Sí" },
          { codigo: "P-2", activo: "No" },
        ],
      },
      { nombre: "Vacía", columnas: [{ header: "X", key: "x" }], filas: [] },
    ])

    expect(esZipXlsx(variasHojas)).toBe(true)
    // Un libro con dos hojas y datos pesa más que uno con una hoja trivial.
    expect(variasHojas.length).toBeGreaterThan(unaHoja.length)
  })
})
