import { requireAuth } from "@/server/auth/auth.queries"
import { TerrenoTabs } from "./(sections)/terreno.tabs"

const TerrenoLayout = async ({ children }: { children: React.ReactNode }) => {
  await requireAuth()
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Terreno</h1>
        <p className="text-sm text-muted-foreground">
          Captura en campo (funciona sin conexión)
        </p>
      </header>
      <TerrenoTabs />
      {children}
    </div>
  )
}

export default TerrenoLayout
