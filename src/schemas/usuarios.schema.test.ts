import { describe, expect, it } from "vitest"
import { crearUsuarioSchema, editarUsuarioSchema } from "./usuarios.schema"

describe("crearUsuarioSchema", () => {
  it("normaliza el username a minúsculas", () => {
    const r = crearUsuarioSchema.safeParse({
      nombre: "Ana",
      username: "ANA",
      role: "consulta",
      permissions: [],
      password: "12345678",
    })
    expect(r.success && r.data.username).toBe("ana")
  })
  it("rechaza contraseña corta", () => {
    expect(
      crearUsuarioSchema.safeParse({
        nombre: "Ana",
        username: "ana",
        role: "consulta",
        password: "123",
      }).success,
    ).toBe(false)
  })
  it("rechaza rol inválido", () => {
    expect(
      crearUsuarioSchema.safeParse({
        nombre: "Ana",
        username: "ana",
        role: "jefe",
        password: "12345678",
      }).success,
    ).toBe(false)
  })
})

describe("editarUsuarioSchema", () => {
  it("acepta datos válidos", () => {
    expect(
      editarUsuarioSchema.safeParse({
        nombre: "Ana",
        role: "gerente",
        permissions: ["productos.ver"],
        activo: true,
      }).success,
    ).toBe(true)
  })
  it("rechaza permiso inexistente", () => {
    expect(
      editarUsuarioSchema.safeParse({
        nombre: "Ana",
        role: "gerente",
        permissions: ["no.existe"],
        activo: true,
      }).success,
    ).toBe(false)
  })
})
