import { describe, expect, it } from "vitest"
import { BACKUP_TABLAS, BACKUP_VERSION } from "@/constants/backup.constants"
import { construirBackup, serializarBackup } from "./backup.utils"

describe("construirBackup", () => {
  it("versiona y estructura el payload", () => {
    const p = construirBackup("2026-07-03T00:00:00.000Z", {
      products: [{ a: 1 }],
    })
    expect(p.version).toBe(BACKUP_VERSION)
    expect(p.fecha).toBe("2026-07-03T00:00:00.000Z")
    expect(p.tablas.products).toEqual([{ a: 1 }])
  })
  it("serializa a JSON parseable", () => {
    const json = serializarBackup(construirBackup("f", { audit: [] }))
    expect(JSON.parse(json)).toEqual({ version: BACKUP_VERSION, fecha: "f", tablas: { audit: [] } })
  })
})

describe("BACKUP_TABLAS", () => {
  it("incluye las tablas de dominio", () => {
    for (const t of ["products", "movements", "users", "config", "audit"])
      expect(BACKUP_TABLAS).toContain(t)
  })
  it("excluye credenciales/sesiones y la bitácora del migrador", () => {
    for (const t of ["accounts", "sessions", "verifications", "migrationLog"])
      expect(BACKUP_TABLAS).not.toContain(t)
  })
})
