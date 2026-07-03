import { renderToBuffer } from "@react-pdf/renderer"
import { describe, expect, it } from "vitest"
import type { ResumenPano } from "@/types/invplantas.types"
import type { ConfirmacionRow } from "@/types/ordenes.types"
import type { FilaDesviacion, KpisPresupuesto } from "@/types/presupuesto.types"
import { AplicacionesConfirmadasPdf } from "./aplicaciones-confirmadas.pdf"
import { PresupuestoPdf } from "./presupuesto.pdf"
import { ResumenInvplantasPdf } from "./resumen-invplantas.pdf"

// Llamar el componente como función devuelve el elemento react-pdf (Document);
// renderToBuffer produce un PDF real. Verifica que los layouts no crashean.
const esPdf = async (doc: Parameters<typeof renderToBuffer>[0]) => {
  const buffer = await renderToBuffer(doc)
  return buffer.subarray(0, 4).toString() === "%PDF"
}

const resumen: ResumenPano[] = [
  {
    clave: "1|Frutal",
    cuartelId: 1,
    cuartel: "C1",
    variedad: "Frutal",
    nHileras: 2,
    totalPlantas: 10,
    principal: 8,
    poliniz: 2,
    estados: { sano: 6, debil: 2, muerto: 1, replante: 1, falta: 0 },
  },
]

const confirmaciones: ConfirmacionRow[] = [
  {
    id: 1,
    ordenId: 5,
    ordenNumero: "OA-00005",
    fechaApp: "2026-06-01",
    horaInicio: "08:00",
    horaFin: "10:00",
    operador: "Juan",
    equipo: "Tractor",
    turno: "Mañana",
    tempAmb: 20,
    humedad: 50,
    viento: 5,
    condClima: "Despejado",
    panoIds: ["1"],
    productosReales: [{ nombre: "Producto A", qtyAplicada: 2, unitS: "L" }],
    aguaReal: 1000,
    notas: "",
  },
]

const kpis: KpisPresupuesto = {
  ppto: 1000,
  real: 1200,
  dev: 200,
  devPct: 20,
  mesesReal: 3,
  avance: 120,
  maxOverrun: { label: "Fertilizante", monto: 150 },
}

const top: FilaDesviacion[] = [
  { label: "Fertilizante", dev: 150, ppto: 500, real: 650, devPct: 30 },
]

describe("reportes PDF (render smoke)", () => {
  it("resumen invplantas → PDF", async () => {
    expect(await esPdf(ResumenInvplantasPdf({ resumen, generado: "hoy" }))).toBe(
      true,
    )
  })

  it("resumen invplantas vacío → PDF", async () => {
    expect(
      await esPdf(ResumenInvplantasPdf({ resumen: [], generado: "hoy" })),
    ).toBe(true)
  })

  it("aplicaciones confirmadas → PDF", async () => {
    expect(
      await esPdf(
        AplicacionesConfirmadasPdf({ confirmaciones, generado: "hoy" }),
      ),
    ).toBe(true)
  })

  it("presupuesto → PDF", async () => {
    expect(
      await esPdf(PresupuestoPdf({ kpis, top, moneda: "CLP", generado: "hoy" })),
    ).toBe(true)
  })

  it("presupuesto sin desviaciones → PDF", async () => {
    expect(
      await esPdf(
        PresupuestoPdf({ kpis, top: [], moneda: "USD", generado: "hoy" }),
      ),
    ).toBe(true)
  })
})
