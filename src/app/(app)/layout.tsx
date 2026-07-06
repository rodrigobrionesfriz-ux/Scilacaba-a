import { requireAuth } from "@/server/auth/auth.queries"
import { AppShell } from "./(sections)/app.shell"

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  const usuario = await requireAuth()
  return (
    <AppShell
      usuario={{
        nombre: usuario.nombre,
        email: usuario.email,
        role: usuario.role,
        permissions: usuario.permissions,
      }}
    >
      {children}
    </AppShell>
  )
}

export default AppLayout
