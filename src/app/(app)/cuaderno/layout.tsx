import { requirePermiso } from "@/server/auth/auth.queries"
import { CuadernoTabs } from "./(sections)/cuaderno.tabs"

const CuadernoLayout = async ({ children }: { children: React.ReactNode }) => {
  await requirePermiso("cuaderno.ver")
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Cuaderno de Campo</h1>
      </header>
      <CuadernoTabs />
      {children}
    </div>
  )
}

export default CuadernoLayout
