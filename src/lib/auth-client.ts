import { usernameClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

// Cliente de better-auth para componentes (login por username, cambio de password,
// logout). baseURL = origen actual. Vive en lib (no toca db).
export const authClient = createAuthClient({
  plugins: [usernameClient()],
})

export const { signIn, signOut, changePassword, useSession } = authClient
