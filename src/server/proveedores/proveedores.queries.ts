import { asc } from "drizzle-orm"
import { db } from "@/db/client"
import { providers } from "@/db/schema"
import type { Proveedor } from "@/schemas/proveedores.schema"

export const getProveedores = async (): Promise<Proveedor[]> => {
  const rows = await db
    .select()
    .from(providers)
    .orderBy(asc(providers.razonSocial))
  return rows.map((r) => ({
    codigo: r.codigo,
    razonSocial: r.razonSocial,
    rut: r.rut ?? "",
    giro: r.giro ?? "",
    direccion: r.direccion ?? "",
    comuna: r.comuna ?? "",
    ciudad: r.ciudad ?? "",
    telefono: r.telefono ?? "",
    email: r.email ?? "",
    contacto: r.contacto ?? "",
    activo: r.activo,
  }))
}
