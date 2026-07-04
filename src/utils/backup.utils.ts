import { BACKUP_VERSION } from "@/constants/backup.constants"
import type { BackupPayload } from "@/types/backup.types"

// Ensambla el payload del respaldo (parte pura). El I/O (leer tablas, fecha) lo
// hace la action; aquí solo se estructura y versiona.
export const construirBackup = (
  fecha: string,
  tablas: Record<string, unknown[]>,
): BackupPayload => ({
  version: BACKUP_VERSION,
  fecha,
  tablas,
})

// Serializa el payload a JSON legible (indentado).
export const serializarBackup = (payload: BackupPayload): string =>
  JSON.stringify(payload, null, 2)
