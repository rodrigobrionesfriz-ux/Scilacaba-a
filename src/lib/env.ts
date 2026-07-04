import { envSchema } from "@/schemas/env.schema"

// Validación de entorno al arranque (regla 8). Falla temprano y con un mensaje
// claro por variable si el entorno está mal configurado, en vez de romper más
// tarde con errores opacos. Solo lo importan capas server/db (nunca cliente):
// no exportar esto a componentes de cliente para no filtrar secretos al bundle.
const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const detalle = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(raíz)"}: ${issue.message}`)
    .join("\n")
  throw new Error(`Variables de entorno inválidas o faltantes:\n${detalle}`)
}

export const env = parsed.data
