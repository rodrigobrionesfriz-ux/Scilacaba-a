import { describe, expect, it } from "vitest"
import { can, itemVisible } from "./permisos.utils"
import { ROLE_PERMS } from "@/constants/permisos.constants"

const user = (role: string, permissions: readonly string[]) => ({
  role,
  permissions,
})

describe("can", () => {
  it("admin tiene acceso total aunque su lista esté vacía", () => {
    expect(can(user("admin", []), "usuarios.crear")).toBe(true)
    expect(can(user("admin", []), "config.editar")).toBe(true)
  })

  it("usuario nulo no tiene acceso", () => {
    expect(can(null, "productos.ver")).toBe(false)
    expect(can(undefined, "productos.ver")).toBe(false)
  })

  it("respeta los defaults de gerente (solo lectura)", () => {
    const g = user("gerente", ROLE_PERMS.gerente)
    expect(can(g, "productos.ver")).toBe(true)
    expect(can(g, "productos.crear")).toBe(false)
  })

  it("respeta los defaults de agrónomo (cuaderno)", () => {
    const a = user("agronomo", ROLE_PERMS.agronomo)
    expect(can(a, "cuaderno.editar")).toBe(true)
    expect(can(a, "movimientos.crear")).toBe(false)
  })

  it("opconteos solo accede a terreno", () => {
    const o = user("opconteos", ROLE_PERMS.opconteos)
    expect(can(o, "conteos.ver")).toBe(true)
    expect(can(o, "invplantas.ver")).toBe(true)
    expect(can(o, "productos.ver")).toBe(false)
  })

  it("evalúa un permiso específico presente o ausente", () => {
    const u = user("consulta", ["stock.ver"])
    expect(can(u, "stock.ver")).toBe(true)
    expect(can(u, "movimientos.anular")).toBe(false)
  })
})

describe("itemVisible", () => {
  it("ítem sin permiso es visible para cualquier usuario logueado", () => {
    expect(itemVisible(user("consulta", []), { perm: null })).toBe(true)
  })

  it("ítem adminOnly solo lo ve admin", () => {
    expect(
      itemVisible(user("admin", []), { perm: null, adminOnly: true }),
    ).toBe(true)
    expect(
      itemVisible(user("gerente", []), { perm: null, adminOnly: true }),
    ).toBe(false)
  })

  it("ítem con permiso respeta can()", () => {
    expect(
      itemVisible(user("opconteos", ROLE_PERMS.opconteos), {
        perm: "conteos.ver",
      }),
    ).toBe(true)
    expect(
      itemVisible(user("opconteos", ROLE_PERMS.opconteos), {
        perm: "productos.ver",
      }),
    ).toBe(false)
  })
})
