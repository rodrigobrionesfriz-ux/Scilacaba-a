import { Text, View } from "@react-pdf/renderer"
import { ESTADOS_PLANTA } from "@/constants/terreno.constants"
import type { ResumenPano } from "@/types/invplantas.types"
import { fmtNumero, totalesResumenInvplantas } from "@/utils/reportes.utils"
import { estilosReporte, ReportePdf } from "./reporte-layout.pdf"

// Reporte de inventario de huerto: resumen por cuartel con desglose por estado
// (espeja la vista de revisión de invplantas).
export const ResumenInvplantasPdf = ({
  resumen,
  generado,
}: {
  resumen: ResumenPano[]
  generado: string
}) => {
  const totales = totalesResumenInvplantas(resumen)
  return (
    <ReportePdf
      titulo="Inventario de Huerto — Resumen por cuartel"
      generado={generado}
    >
      {resumen.length === 0 ? (
        <Text style={estilosReporte.vacio}>
          No hay hileras sincronizadas para resumir.
        </Text>
      ) : (
        <View>
          <View style={estilosReporte.fila}>
            <Text style={[estilosReporte.th, { width: "22%" }]}>Cuartel</Text>
            <Text style={[estilosReporte.th, { width: "16%" }]}>Variedad</Text>
            <Text style={[estilosReporte.th, estilosReporte.num, { width: "10%" }]}>
              Hileras
            </Text>
            <Text style={[estilosReporte.th, estilosReporte.num, { width: "12%" }]}>
              Total
            </Text>
            {ESTADOS_PLANTA.map((e) => (
              <Text
                key={e.value}
                style={[estilosReporte.th, estilosReporte.num, { width: "8%" }]}
              >
                {e.label}
              </Text>
            ))}
          </View>
          {resumen.map((r) => (
            <View key={r.clave} style={estilosReporte.fila}>
              <Text style={[estilosReporte.td, { width: "22%" }]}>
                {r.cuartel}
              </Text>
              <Text style={[estilosReporte.td, { width: "16%" }]}>
                {r.variedad}
              </Text>
              <Text style={[estilosReporte.td, estilosReporte.num, { width: "10%" }]}>
                {fmtNumero(r.nHileras)}
              </Text>
              <Text style={[estilosReporte.td, estilosReporte.num, { width: "12%" }]}>
                {fmtNumero(r.totalPlantas)}
              </Text>
              {ESTADOS_PLANTA.map((e) => (
                <Text
                  key={e.value}
                  style={[estilosReporte.td, estilosReporte.num, { width: "8%" }]}
                >
                  {fmtNumero(r.estados[e.value])}
                </Text>
              ))}
            </View>
          ))}
          <View style={estilosReporte.fila}>
            <Text style={[estilosReporte.td, estilosReporte.bold, { width: "38%" }]}>
              Totales
            </Text>
            <Text style={[estilosReporte.td, { width: "10%" }]} />
            <Text
              style={[
                estilosReporte.td,
                estilosReporte.num,
                estilosReporte.bold,
                { width: "12%" },
              ]}
            >
              {fmtNumero(totales.totalPlantas)}
            </Text>
            {ESTADOS_PLANTA.map((e) => (
              <Text
                key={e.value}
                style={[
                  estilosReporte.td,
                  estilosReporte.num,
                  estilosReporte.bold,
                  { width: "8%" },
                ]}
              >
                {fmtNumero(totales.porEstado[e.value])}
              </Text>
            ))}
          </View>
        </View>
      )}
    </ReportePdf>
  )
}
