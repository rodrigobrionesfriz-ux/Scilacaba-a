import { Text, View } from "@react-pdf/renderer"
import type { ConfirmacionRow } from "@/types/ordenes.types"
import { fmtNumero } from "@/utils/reportes.utils"
import { estilosReporte, ReportePdf } from "./reporte-layout.pdf"

// Reporte del Cuaderno de Campo: aplicaciones confirmadas (una fila por
// confirmación, con los productos realmente aplicados).
export const AplicacionesConfirmadasPdf = ({
  confirmaciones,
  generado,
}: {
  confirmaciones: ConfirmacionRow[]
  generado: string
}) => (
  <ReportePdf
    titulo="Cuaderno de Campo — Aplicaciones confirmadas"
    subtitulo={`${confirmaciones.length} aplicación(es) confirmada(s)`}
    generado={generado}
  >
    {confirmaciones.length === 0 ? (
      <Text style={estilosReporte.vacio}>
        No hay aplicaciones confirmadas.
      </Text>
    ) : (
      <View>
        <View style={estilosReporte.fila}>
          <Text style={[estilosReporte.th, { width: "12%" }]}>Orden</Text>
          <Text style={[estilosReporte.th, { width: "12%" }]}>Fecha</Text>
          <Text style={[estilosReporte.th, { width: "16%" }]}>Operador</Text>
          <Text style={[estilosReporte.th, { width: "14%" }]}>Equipo</Text>
          <Text style={[estilosReporte.th, { width: "10%" }]}>Turno</Text>
          <Text style={[estilosReporte.th, estilosReporte.num, { width: "10%" }]}>
            Agua (L)
          </Text>
          <Text style={[estilosReporte.th, { width: "26%" }]}>Productos</Text>
        </View>
        {confirmaciones.map((c) => (
          <View key={c.id} style={estilosReporte.fila}>
            <Text style={[estilosReporte.td, { width: "12%" }]}>
              {c.ordenNumero}
            </Text>
            <Text style={[estilosReporte.td, { width: "12%" }]}>
              {c.fechaApp}
            </Text>
            <Text style={[estilosReporte.td, { width: "16%" }]}>
              {c.operador}
            </Text>
            <Text style={[estilosReporte.td, { width: "14%" }]}>{c.equipo}</Text>
            <Text style={[estilosReporte.td, { width: "10%" }]}>{c.turno}</Text>
            <Text style={[estilosReporte.td, estilosReporte.num, { width: "10%" }]}>
              {c.aguaReal === null ? "—" : fmtNumero(c.aguaReal)}
            </Text>
            <Text style={[estilosReporte.td, { width: "26%" }]}>
              {c.productosReales.map((p) => p.nombre).join(", ") || "—"}
            </Text>
          </View>
        ))}
      </View>
    )}
  </ReportePdf>
)
