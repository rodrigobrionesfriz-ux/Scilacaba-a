import { z } from "zod"
import { PERMISOS, ROLES } from "@/constants/permisos.constants"

const rolValido = (r: string) => ROLES.some((x) => x === r)
const permisoValido = (p: string) => PERMISOS.some(([clave]) => clave === p)

const permissionsSchema = z
  .array(z.string().refine(permisoValido, "Permiso inválido"))
  .default([])

export const crearUsuarioSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  username: z
    .string()
    .trim()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .transform((s) => s.toLowerCase()),
  role: z.string().refine(rolValido, "Rol inválido"),
  permissions: permissionsSchema,
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
})
export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>

export const editarUsuarioSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  role: z.string().refine(rolValido, "Rol inválido"),
  permissions: permissionsSchema,
  activo: z.boolean(),
})
export type EditarUsuarioInput = z.infer<typeof editarUsuarioSchema>

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
})
