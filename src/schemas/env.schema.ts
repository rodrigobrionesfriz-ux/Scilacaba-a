import { z } from "zod"

// Variables de entorno de runtime de la app (regla 13). Solo las que la app
// necesita en producción. FIREBASE_* y SEED_PASSWORD son de scripts (migrador y
// seed), no del runtime, por eso no se validan aquí.
export const envSchema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
})

export type Env = z.infer<typeof envSchema>
