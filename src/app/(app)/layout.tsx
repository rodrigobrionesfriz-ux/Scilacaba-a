import { requireAuth } from "@/server/auth/auth.queries"
import { AppSidebar } from "./(sections)/app.sidebar"
import { AppTopbar } from "./(sections)/app.topbar"

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  const usuario = await requireAuth()
  return (
    <div className="flex min-h-screen">
      <AppSidebar role={usuario.role} permissions={usuario.permissions} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar
          nombre={usuario.nombre}
          email={usuario.email}
          role={usuario.role}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}

export default AppLayout
