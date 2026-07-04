import { requirePermiso } from "@/server/auth/auth.queries"
import { ConfigView } from "./(sections)/config.view"

const ConfigPage = async () => {
  await requirePermiso("config.ver")
  return <ConfigView />
}

export default ConfigPage
