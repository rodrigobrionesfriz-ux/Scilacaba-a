import { requireAdmin } from "@/server/auth/auth.queries"
import { AuditoriaView } from "./(sections)/auditoria.view"

const AuditoriaPage = async () => {
  await requireAdmin()
  return <AuditoriaView />
}

export default AuditoriaPage
