import {
  CODIGO_PRODUCTO_PADDING,
  PREFIJO_PRODUCTO,
} from "@/constants/productos.constants"

// Formatea el correlativo del counter "PRODUCTO" como código interno (P000123).
// index.html:3999-4004.
export const formatCodigoProducto = (valor: number): string =>
  PREFIJO_PRODUCTO + String(valor).padStart(CODIGO_PRODUCTO_PADDING, "0")
