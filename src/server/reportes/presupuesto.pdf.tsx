import { StyleSheet, Text, View } from "@react-pdf/renderer"
import type {
  FilaDesviacion,
  KpisPresupuesto,
  Moneda,
} from "@/types/presupuesto.types"
import { fmtMoneda, fmtPct } from "@/utils/reportes.utils"
import { estilosReporte, ReportePdf } from "./reporte-layout.pdf"

const estilos = StyleSheet.create({
  kpis: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  kpi: { width: "25%", paddingVertical: 6, paddingRight: 8 },
  kpiLabel: { fontSize: 7, color: "#6b7280", textTransform: "uppercase" },
  kpiValor: { fontSize: 12, fontWeight: "bold", marginTop: 2 },
  seccion: { fontSize: 11, fontWeight: "bold", marginBottom: 6 },
})

// Reporte ejecutivo tabular de presupuesto (KPIs + Top Desviaciones). Sin
// gráficos: recharts no renderiza en react-pdf (ADR-015).
export const PresupuestoPdf = ({
  kpis,
  top,
  moneda,
  generado,
}: {
  kpis: KpisPresupuesto
  top: FilaDesviacion[]
  moneda: Moneda
  generado: string
}) => (
  <ReportePdf
    titulo="Control de Presupuesto — Reporte Gerencial"
    subtitulo={`Moneda: ${moneda}`}
    generado={generado}
  >
    <View style={estilos.kpis}>
      <View style={estilos.kpi}>
        <Text style={estilos.kpiLabel}>Presupuesto total</Text>
        <Text style={estilos.kpiValor}>{fmtMoneda(kpis.ppto, moneda)}</Text>
      </View>
      <View style={estilos.kpi}>
        <Text style={estilos.kpiLabel}>Real acumulado</Text>
        <Text style={estilos.kpiValor}>{fmtMoneda(kpis.real, moneda)}</Text>
      </View>
      <View style={estilos.kpi}>
        <Text style={estilos.kpiLabel}>Desviación</Text>
        <Text style={estilos.kpiValor}>
          {fmtMoneda(kpis.dev, moneda)} ({fmtPct(kpis.devPct)})
        </Text>
      </View>
      <View style={estilos.kpi}>
        <Text style={estilos.kpiLabel}>Meses con real</Text>
        <Text style={estilos.kpiValor}>{kpis.mesesReal}</Text>
      </View>
      <View style={estilos.kpi}>
        <Text style={estilos.kpiLabel}>Avance</Text>
        <Text style={estilos.kpiValor}>
          {kpis.avance === null ? "—" : `${kpis.avance}%`}
        </Text>
      </View>
      <View style={estilos.kpi}>
        <Text style={estilos.kpiLabel}>Mayor sobreejecución</Text>
        <Text style={estilos.kpiValor}>
          {kpis.maxOverrun ? fmtMoneda(kpis.maxOverrun.monto, moneda) : "—"}
        </Text>
      </View>
    </View>

    <Text style={estilos.seccion}>Top Desviaciones</Text>
    {top.length === 0 ? (
      <Text style={estilosReporte.vacio}>Sin desviaciones para mostrar.</Text>
    ) : (
      <View>
        <View style={estilosReporte.fila}>
          <Text style={[estilosReporte.th, { width: "46%" }]}>Descripción</Text>
          <Text style={[estilosReporte.th, estilosReporte.num, { width: "18%" }]}>
            Ppto
          </Text>
          <Text style={[estilosReporte.th, estilosReporte.num, { width: "18%" }]}>
            Real
          </Text>
          <Text style={[estilosReporte.th, estilosReporte.num, { width: "18%" }]}>
            Desv
          </Text>
        </View>
        {top.map((f) => (
          <View key={f.label} style={estilosReporte.fila}>
            <Text style={[estilosReporte.td, { width: "46%" }]}>{f.label}</Text>
            <Text style={[estilosReporte.td, estilosReporte.num, { width: "18%" }]}>
              {fmtMoneda(f.ppto, moneda)}
            </Text>
            <Text style={[estilosReporte.td, estilosReporte.num, { width: "18%" }]}>
              {fmtMoneda(f.real, moneda)}
            </Text>
            <Text style={[estilosReporte.td, estilosReporte.num, { width: "18%" }]}>
              {fmtMoneda(f.dev, moneda)} ({fmtPct(f.devPct)})
            </Text>
          </View>
        ))}
      </View>
    )}
  </ReportePdf>
)
