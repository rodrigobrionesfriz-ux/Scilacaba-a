import { db } from "@/db/client"
import { audit } from "@/db/schema"
import { construirEntradaAudit } from "@/utils/audit.utils"

type RegistrarArgs = {
  usuario: string | null | undefined
  accion: string
  detalle: string
  referencia?: string
}

// Escribe una entrada de auditoría. Helper normal de la capa server (no
// "use server"): lo llaman los Server Actions tras una mutación. Nunca lanza —
// si el insert falla, solo loguea; una mutación no debe romperse porque la
// auditoría falle (paridad con el try/catch del monolito, index.html:9162).
export const registrarAuditoria = async ({
  usuario,
  accion,
  detalle,
  referencia,
}: RegistrarArgs): Promise<void> => {
  try {
    const entrada = construirEntradaAudit(usuario, accion, detalle, referencia)
    await db
      .insert(audit)
      .values({ id: crypto.randomUUID(), fecha: new Date(), ...entrada })
  } catch (e) {
    console.error("registrarAuditoria falló:", e)
  }
}
