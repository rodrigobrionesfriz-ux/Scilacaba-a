import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import type { ReactNode } from "react"
import { EMPRESA_NOMBRE } from "@/constants/export.constants"

// Estilos compartidos por los reportes PDF (tablas de View/Text). No es un
// componente, se co-ubica con el layout para reuso.
export const estilosReporte = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1f2937",
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e3e8ee",
    paddingBottom: 8,
  },
  empresa: { fontSize: 8, color: "#6b7280" },
  titulo: { fontSize: 15, fontWeight: "bold", marginTop: 2 },
  sub: { fontSize: 9, color: "#6b7280", marginTop: 2 },
  fila: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f6",
  },
  th: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#475569",
    padding: 4,
    backgroundColor: "#f8fafc",
  },
  td: { padding: 4 },
  num: { textAlign: "right" },
  bold: { fontWeight: "bold" },
  vacio: {
    marginTop: 12,
    fontSize: 10,
    color: "#6b7280",
  },
})

// Envoltura común: Document + Page A4 con cabecera (empresa, título, fecha).
export const ReportePdf = ({
  titulo,
  subtitulo,
  generado,
  children,
}: {
  titulo: string
  subtitulo?: string
  generado: string
  children: ReactNode
}) => (
  <Document title={titulo} author={EMPRESA_NOMBRE}>
    <Page size="A4" style={estilosReporte.page}>
      <View style={estilosReporte.header}>
        <Text style={estilosReporte.empresa}>{EMPRESA_NOMBRE}</Text>
        <Text style={estilosReporte.titulo}>{titulo}</Text>
        {subtitulo ? <Text style={estilosReporte.sub}>{subtitulo}</Text> : null}
        <Text style={estilosReporte.sub}>Generado: {generado}</Text>
      </View>
      {children}
    </Page>
  </Document>
)
