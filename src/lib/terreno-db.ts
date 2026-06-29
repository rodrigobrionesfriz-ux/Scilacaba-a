import Dexie, { type EntityTable } from "dexie"
import type { Conteo, ConteoLocal } from "@/types/conteos.types"
import type { InvplantaLocal, SesionInvplanta } from "@/types/invplantas.types"

// Capa de datos offline de Terreno (ADR-003). IndexedDB vía Dexie: la captura en
// campo (sin señal) escribe aquí primero; la subida a la nube (Server Action) hace
// upsert por `id` en Postgres. Solo se usa desde componentes cliente. Hoja `lib`:
// importa tipos/constantes/utils, no capas superiores.
//
// v1: tabla `conteos`. v2 (7b): añade `invplantas` (Inventario de huerto). Dexie
// conserva las tablas previas en el bump. No se indexa `sincronizado` (IndexedDB
// no indexa booleanos) → los pendientes se filtran en memoria.

const db = new Dexie("SCI_TERRENO") as Dexie & {
  conteos: EntityTable<ConteoLocal, "id">
  invplantas: EntityTable<InvplantaLocal, "id">
}

db.version(1).stores({ conteos: "id, fechaInicio" })
db.version(2).stores({
  conteos: "id, fechaInicio",
  invplantas: "id, fechaInicio",
})

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

// ─── Inventario de huerto (invplantas) ───

// Guarda (o reemplaza) una hilera capturada, marcada como no sincronizada.
export const guardarInvplantaLocal = async (
  sesion: SesionInvplanta,
): Promise<void> => {
  await db.invplantas.put({ ...sesion, sincronizado: false, fechaSync: null })
}

// Todas las hileras locales, más recientes primero.
export const listarInvplantasLocales = async (): Promise<InvplantaLocal[]> =>
  db.invplantas.orderBy("fechaInicio").reverse().toArray()

// Hileras aún no subidas a la nube.
export const invplantasPendientes = async (): Promise<InvplantaLocal[]> =>
  db.invplantas.filter((i) => !i.sincronizado).toArray()

// Marca un lote de hileras como sincronizadas tras subir a la nube.
export const marcarInvplantasSincronizadas = async (
  ids: readonly string[],
  fechaSync: string,
): Promise<void> => {
  await db.invplantas
    .where("id")
    .anyOf([...ids])
    .modify({ sincronizado: true, fechaSync })
}

// Elimina una hilera local (p. ej. tras subir y querer liberar el dispositivo).
export const eliminarInvplantaLocal = async (id: string): Promise<void> => {
  await db.invplantas.delete(id)
}
