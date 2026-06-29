import Dexie, { type EntityTable } from "dexie"
import type { Conteo, ConteoLocal } from "@/types/conteos.types"

// Capa de datos offline de Terreno (ADR-003). IndexedDB vía Dexie: la captura en
// campo (sin señal) escribe aquí primero; la subida a la nube (Server Action) hace
// upsert por `id` en Postgres. Solo se usa desde componentes cliente. Hoja `lib`:
// importa tipos/constantes/utils, no capas superiores.
//
// v1: tabla `conteos`. El Inventario de huerto (`invplantas`) añadirá su tabla en
// 7b con un bump de versión. No se indexa `sincronizado` (IndexedDB no indexa
// booleanos) → los pendientes se filtran en memoria.

const db = new Dexie("SCI_TERRENO") as Dexie & {
  conteos: EntityTable<ConteoLocal, "id">
}

db.version(1).stores({ conteos: "id, fechaInicio" })

export const terrenoDb = db

// Guarda (o reemplaza) una sesión de conteo capturada, marcada como no sincronizada.
export const guardarConteoLocal = async (conteo: Conteo): Promise<void> => {
  await db.conteos.put({ ...conteo, sincronizado: false, fechaSync: null })
}

// Todas las sesiones locales, más recientes primero.
export const listarConteosLocales = async (): Promise<ConteoLocal[]> =>
  db.conteos.orderBy("fechaInicio").reverse().toArray()

// Sesiones aún no subidas a la nube.
export const conteosPendientes = async (): Promise<ConteoLocal[]> =>
  db.conteos.filter((c) => !c.sincronizado).toArray()

// Marca un lote de sesiones como sincronizadas tras subir a la nube.
export const marcarSincronizados = async (
  ids: readonly string[],
  fechaSync: string,
): Promise<void> => {
  await db.conteos
    .where("id")
    .anyOf([...ids])
    .modify({ sincronizado: true, fechaSync })
}

// Elimina una sesión local (p. ej. tras subir y querer liberar el dispositivo).
export const eliminarConteoLocal = async (id: string): Promise<void> => {
  await db.conteos.delete(id)
}
