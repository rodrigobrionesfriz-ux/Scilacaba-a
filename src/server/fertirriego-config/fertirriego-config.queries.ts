import { eq } from "drizzle-orm"
import { db } from "@/db/client"
import { fertirriegoConfig } from "@/db/schema"
import type { ConfigFert } from "@/types/fertirriego.types"
import { aConfigFert } from "@/utils/fertirriego.utils"

// Configuración singleton (id = "main"), fusionada con los defaults del monolito.
export const getConfigFert = async (): Promise<ConfigFert> => {
  const row = await db.query.fertirriegoConfig.findFirst({
    where: eq(fertirriegoConfig.id, "main"),
  })
  return aConfigFert(row?.cfg)
}
