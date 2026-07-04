// Fila del listado de usuarios (Administración → Usuarios).
export type UsuarioRow = {
  id: string
  nombre: string
  username: string
  email: string
  role: string
  activo: boolean
  permissions: string[]
}
