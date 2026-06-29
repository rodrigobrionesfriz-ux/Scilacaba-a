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

  it("los módulos disponibles son los construidos hasta esta fase", () => {
    const disponibles = NAV.flatMap((s) => s.items)
      .filter((i) => i.disponible)
      .map((i) => i.id)
    // Fase 2: dashboard. Fase 3: maestros. Fase 4: stock + movimientos.
    // Fase 5: tomas de inventario. Fase 6a: cuaderno de campo.
    // Fase 7a: conteos en terreno. Fase 7b: inventario de huerto.
    expect([...disponibles].sort()).toEqual(
      [
        "dashboard",
        "productos",
        "bodegas",
        "proveedores",
        "clientes",
        "centrosCosto",
        "stock",
        "movimientos",
        "entradas",
        "salidas",
        "tomas",
        "cuaderno",
        "conteos",
        "invplantas",
      ].sort(),
    )
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
