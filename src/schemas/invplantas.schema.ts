import { z } from "zod"
import {
  ESTADOS_PLANTA_VALUES,
  TIPOS_PLANTA,
} from "@/constants/terreno.constants"

// Validación del Inventario de huerto (regla 13). Importa solo constantes. La
// captura es offline (Dexie); estos schemas validan al sincronizar/editar en
// Postgres. El servidor es la fuente de verdad de `plantas[]` y los contadores.

export const gpsSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  precision: z.number().nullable(),
  hora: z.string().nullable(),
})

export const pasoSecuenciaSchema = z.object({
  tipo: z.enum(TIPOS_PLANTA),
  estado: z.enum(ESTADOS_PLANTA_VALUES),
})

// Una hilera capturada (unidad de subida). `plantas` no viaja: se deriva de la
// secuencia en el servidor (zigzag + GPS interpolado).
export const invplantaSchema = z.object({
  id: z.string().min(1),
  cuartelId: z.number().int().nullable(),
  cuartel: z.string(),
  variedad: z.string(),
  portainjerto: z.string(),
  polinizante: z.string(),
  hilera: z.string().min(1),
  codigoBase: z.string(),
  usuario: z.string(),
  secuencia: z
    .array(pasoSecuenciaSchema)
    .min(1, "La hilera debe tener al menos una planta"),
  gpsInicio: gpsSchema.nullable(),
  gpsFin: gpsSchema.nullable(),
  fechaInicio: z.string().min(1),
  fechaFin: z.string().nullable(),
})

// Payload de subida ("Subir a la nube"): un lote de hileras pendientes.
export const sincronizarInvplantasSchema = z
  .array(invplantaSchema)
  .min(1, "No hay hileras para sincronizar")

// Edición del mapa 2D (admin, invplantas.editar).
export const editarEstadoSchema = z.object({
  id: z.string().min(1),
  seq: z.number().int().min(1),
  estado: z.enum(ESTADOS_PLANTA_VALUES),
})

export const insertarPlantaSchema = z.object({
  id: z.string().min(1),
  seq: z.number().int().min(1),
  posicion: z.enum(["antes", "despues"]),
  tipo: z.enum(TIPOS_PLANTA),
  estado: z.enum(ESTADOS_PLANTA_VALUES),
})

export const eliminarPlantaSchema = z.object({
  id: z.string().min(1),
  seq: z.number().int().min(1),
})

// Write-back del resumen al Cuaderno (actualiza panos.plantas).
export const actualizarPanoPlantasSchema = z.object({
  panoId: z.number().int(),
  plantas: z.number().int().min(0),
})

export type InvplantaInput = z.infer<typeof invplantaSchema>
export type EditarEstadoInput = z.infer<typeof editarEstadoSchema>
export type InsertarPlantaInput = z.infer<typeof insertarPlantaSchema>
