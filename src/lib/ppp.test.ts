import { describe, expect, it } from "vitest"
import { recalcularPpp } from "./ppp"
import type {
  MovimientoPpp,
  ProductoAtributos,
} from "@/types/movimientos.types"

const prod = (
  codigoInterno: string,
  manejaAtributos = false,
): ProductoAtributos => ({
  codigoInterno,
  manejaAtributos,
})

const ent = (
  numero: string,
  fecha: string,
  bodegaId: string,
  lineas: MovimientoPpp["lineas"],
): MovimientoPpp => ({
  numero,
  direccion: "ENT",
  tipoMovimiento: "COMPRA",
  fecha,
  bodegaId,
  lineas,
})

const sal = (
  numero: string,
  fecha: string,
  bodegaId: string,
  lineas: MovimientoPpp["lineas"],
): MovimientoPpp => ({
  numero,
  direccion: "SAL",
  tipoMovimiento: "VENTA",
  fecha,
  bodegaId,
  lineas,
})

describe("recalcularPpp", () => {
  it("ENT recalcula el promedio ponderado", () => {
    const movs = [
      ent("COMP-1", "2026-01-01", "B1", [
        { codigoInterno: "P1", cantidad: 10, costo: 100 },
      ]),
      ent("COMP-2", "2026-01-02", "B1", [
        { codigoInterno: "P1", cantidad: 10, costo: 200 },
      ]),
    ]
    const { stock } = recalcularPpp(movs, [prod("P1")])
    expect(stock).toHaveLength(1)
    expect(stock[0].cantidad).toBe(20)
    expect(stock[0].costoPromedio).toBe(150)
  })

  it("SAL descuenta cantidad sin cambiar el PPP", () => {
    const movs = [
      ent("COMP-1", "2026-01-01", "B1", [
        { codigoInterno: "P1", cantidad: 10, costo: 100 },
      ]),
      sal("VTA-1", "2026-01-02", "B1", [
        { codigoInterno: "P1", cantidad: 4, costo: 999 },
      ]),
    ]
    const { stock } = recalcularPpp(movs, [prod("P1")])
    expect(stock[0].cantidad).toBe(6)
    expect(stock[0].costoPromedio).toBe(100)
  })

  it("una SAL mayor al saldo deja la cantidad en 0 (no negativa)", () => {
    const movs = [
      ent("COMP-1", "2026-01-01", "B1", [
        { codigoInterno: "P1", cantidad: 10, costo: 100 },
      ]),
      sal("VTA-1", "2026-01-02", "B1", [
        { codigoInterno: "P1", cantidad: 15, costo: 0 },
      ]),
    ]
    const { stock } = recalcularPpp(movs, [prod("P1")])
    expect(stock[0].cantidad).toBe(0)
    expect(stock[0].costoPromedio).toBe(100)
  })

  it("TRASPASO mueve costo del origen al destino sin tocar el PPP del origen", () => {
    const movs = [
      ent("COMP-1", "2026-01-01", "B1", [
        { codigoInterno: "P1", cantidad: 10, costo: 100 },
      ]),
      {
        numero: "TRB-1",
        direccion: "SAL",
        tipoMovimiento: "TRASPASO BODEGA",
        fecha: "2026-01-02",
        bodegaId: "B1",
        bodegaDestinoId: "B2",
        lineas: [{ codigoInterno: "P1", cantidad: 4, costo: 100 }],
      } satisfies MovimientoPpp,
    ]
    const { stock } = recalcularPpp(movs, [prod("P1")])
    const b1 = stock.find((s) => s.bodegaId === "B1")
    const b2 = stock.find((s) => s.bodegaId === "B2")
    expect(b1?.cantidad).toBe(6)
    expect(b1?.costoPromedio).toBe(100)
    expect(b2?.cantidad).toBe(4)
    expect(b2?.costoPromedio).toBe(100)
  })

  it("ignora movimientos anulados", () => {
    const movs: MovimientoPpp[] = [
      {
        ...ent("COMP-1", "2026-01-01", "B1", [
          { codigoInterno: "P1", cantidad: 10, costo: 100 },
        ]),
        anulado: true,
      },
    ]
    const { stock } = recalcularPpp(movs, [prod("P1")])
    expect(stock).toHaveLength(0)
  })

  it("solo genera lotes si el producto maneja atributos y la línea trae lote", () => {
    const conAtributos = recalcularPpp(
      [
        ent("COMP-1", "2026-01-01", "B1", [
          {
            codigoInterno: "P1",
            cantidad: 10,
            costo: 100,
            lote: "L1",
            fechaVenc: "2027-01-01",
          },
        ]),
      ],
      [prod("P1", true)],
    )
    expect(conAtributos.lots).toHaveLength(1)
    expect(conAtributos.lots[0].id).toBe("lot|P1|B1|L1")
    expect(conAtributos.lots[0].cantidad).toBe(10)
    expect(conAtributos.lots[0].costo).toBe(100)
    expect(conAtributos.lots[0].fechaVenc).toBe("2027-01-01")

    const sinAtributos = recalcularPpp(
      [
        ent("COMP-1", "2026-01-01", "B1", [
          { codigoInterno: "P2", cantidad: 10, costo: 100, lote: "L1" },
        ]),
      ],
      [prod("P2", false)],
    )
    expect(sinAtributos.lots).toHaveLength(0)
  })

  it("es determinístico: el orden de entrada no altera el resultado (se ordena cronológicamente)", () => {
    const enOrden = recalcularPpp(
      [
        ent("COMP-1", "2026-01-01", "B1", [
          { codigoInterno: "P1", cantidad: 10, costo: 100 },
        ]),
        ent("COMP-2", "2026-01-02", "B1", [
          { codigoInterno: "P1", cantidad: 10, costo: 200 },
        ]),
      ],
      [prod("P1")],
    )
    const desordenado = recalcularPpp(
      [
        ent("COMP-2", "2026-01-02", "B1", [
          { codigoInterno: "P1", cantidad: 10, costo: 200 },
        ]),
        ent("COMP-1", "2026-01-01", "B1", [
          { codigoInterno: "P1", cantidad: 10, costo: 100 },
        ]),
      ],
      [prod("P1")],
    )
    expect(desordenado).toEqual(enOrden)
  })
})
