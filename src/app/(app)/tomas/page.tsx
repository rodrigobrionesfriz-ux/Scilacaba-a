import { requirePermiso } from "@/server/auth/auth.queries"
import { TomasView } from "./(sections)/tomas.view"

const TomasPage = async () => {
  await requirePermiso("tomas.ver")
  return <TomasView />
}

export default TomasPage
