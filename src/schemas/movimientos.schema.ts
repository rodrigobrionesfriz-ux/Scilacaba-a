import { z } from "zod"
import {
  TIPOS_MOV_ENT,
  TIPOS_MOV_SAL,
  TIPOS_REQUIEREN_CENTRO_COSTO,
  TIPOS_REQUIEREN_CLIENTE,
  TIPOS_REQUIEREN_PROVEEDOR,
  TRASPASO_BODEGA,
} from "@/constants/movimientos.constants"

// Línea de un movimiento. cantidad > 0; costo ≥ 0. lote/fechaVenc solo aplican si
// el producto maneja atributos (la action los nulea si no): el schema no conoce
// los atributos del producto, así que aquí son opcionales.
export const movimientoLineaSchema = z.object({
  codigoInterno: z.string().trim().min(1, "Selecciona un producto"),
  descripcion: z.string().trim().default(""),
  unidadMedida: z.string().trim().default(""),
  cantidad: z.coerce
    .number({ message: "La cantidad debe ser un número" })
    .positive("La cantidad debe ser mayor a 0"),
  costo: z.coerce
    .number({ message: "El costo debe ser un número" })
    .min(0, "El costo no puede ser negativo"),
  lote: z.string().trim().default(""),
  fechaVenc: z.string().trim().default(""),
})

const TIPOS_VALIDOS = [...TIPOS_MOV_ENT, ...TIPOS_MOV_SAL]

// Movimiento de inventario (header + líneas). Las reglas condicionales por tipo
// (traspaso/compra/venta/centro de costo) se validan con refines que adjuntan el
// error al campo correspondiente. El correlativo y la dirección los deriva la action.
export const movimientoSchema = z
  .object({
    tipoMovimiento: z
      .string()
      .trim()
      .min(1, "Selecciona un tipo de movimiento"),
    fecha: z.string().trim().min(1, "La fecha es obligatoria"),
    bodegaId: z.string().trim().min(1, "Selecciona la bodega"),
    bodegaDestinoId: z.string().trim().default(""),
    proveedorCodigo: z.string().trim().default(""),
    clienteCodigo: z.string().trim().default(""),
    centroCosto: z.string().trim().default(""),
    documento: z.string().trim().default(""),
    tipoDoc: z.string().trim().default(""),
    numeroDoc: z.string().trim().default(""),
    observaciones: z.string().trim().default(""),
    autorizadoPor: z.string().trim().default(""),
    lineas: z.array(movimientoLineaSchema).min(1, "Agrega al menos una línea"),
  })
  .refine((d) => TIPOS_VALIDOS.includes(d.tipoMovimiento), {
    message: "Tipo de movimiento inválido",
    path: ["tipoMovimiento"],
  })
  .refine(
    (d) => d.tipoMovimiento !== TRASPASO_BODEGA || d.bodegaDestinoId !== "",
    { message: "Selecciona la bodega de destino", path: ["bodegaDestinoId"] },
  )
  .refine(
    (d) =>
      d.tipoMovimiento !== TRASPASO_BODEGA ||
      d.bodegaDestinoId !== d.bodegaId,
    {
      message: "La bodega de destino debe ser distinta a la de origen",
      path: ["bodegaDestinoId"],
    },
  )
  .refine(
    (d) =>
      !TIPOS_REQUIEREN_PROVEEDOR.includes(d.tipoMovimiento) ||
      d.proveedorCodigo !== "",
    { message: "Selecciona el proveedor", path: ["proveedorCodigo"] },
  )
  .refine(
    (d) =>
      !TIPOS_REQUIEREN_CLIENTE.includes(d.tipoMovimiento) ||
      d.clienteCodigo !== "",
    { message: "Selecciona el cliente", path: ["clienteCodigo"] },
  )
  .refine(
    (d) =>
      !TIPOS_REQUIEREN_CENTRO_COSTO.includes(d.tipoMovimiento) ||
      d.centroCosto !== "",
    { message: "Selecciona el centro de costo", path: ["centroCosto"] },
  )

export type Movimiento = z.infer<typeof movimientoSchema>
export type MovimientoLinea = z.infer<typeof movimientoLineaSchema>
