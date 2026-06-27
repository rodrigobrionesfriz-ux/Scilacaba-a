import { describe, expect, it } from "vitest"
import { NAV } from "./navegacion.constants"
import { PERMISOS, ROLE_PERMS } from "./permisos.constants"

const CLAVES = new Set<string>(PERMISOS.map((p) => p[0]))

describe("NAV", () => {
  it("cada perm referido en la navegación existe en el catálogo", () => {
    for (const seccion of NAV) {
      for (const item of seccion.items) {
        if (item.perm !== null) {
          expect(CLAVES.has(item.perm), `perm desconocido: ${item.perm}`).toBe(
            true,
          )
        }
      }
    }
  })

  it("solo el dashboard está disponible en esta fase", () => {
    const disponibles = NAV.flatMap((s) => s.items).filter((i) => i.disponible)
    expect(disponibles.map((i) => i.id)).toEqual(["dashboard"])
  })
})

describe("ROLE_PERMS", () => {
  it("todos los permisos por rol existen en el catálogo", () => {
    for (const [, perms] of Object.entries(ROLE_PERMS)) {
      for (const p of perms) {
        expect(CLAVES.has(p), `perm desconocido: ${p}`).toBe(true)
      }
    }
  })
})
