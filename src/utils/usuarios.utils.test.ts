import { describe, expect, it } from "vitest"
import { esUltimoAdminActivo, permisosDeRol } from "./usuarios.utils"

const u = (id: string, role: string, activo: boolean) => ({ id, role, activo })

describe("esUltimoAdminActivo", () => {
  it("true si es el único admin activo", () => {
    expect(
      esUltimoAdminActivo([u("a", "admin", true), u("b", "gerente", true)], "a"),
    ).toBe(true)
  })
  it("false si hay otro admin activo", () => {
    expect(
      esUltimoAdminActivo([u("a", "admin", true), u("b", "admin", true)], "a"),
    ).toBe(false)
  })
  it("false si el admin está inactivo (ya no cuenta)", () => {
    expect(
      esUltimoAdminActivo([u("a", "admin", true), u("b", "admin", false)], "b"),
    ).toBe(false)
  })
  it("false para un usuario no-admin", () => {
    expect(
      esUltimoAdminActivo([u("a", "admin", true), u("b", "gerente", true)], "b"),
    ).toBe(false)
  })
})

describe("permisosDeRol", () => {
  it("devuelve los permisos del rol", () => {
    expect(permisosDeRol({ admin: ["x", "y"] }, "admin")).toEqual(["x", "y"])
  })
  it("[] si el rol no existe", () => {
    expect(permisosDeRol({ admin: ["x"] }, "otro")).toEqual([])
  })
})
