import { asc } from "drizzle-orm"
import { db } from "@/db/client"
import { customers } from "@/db/schema"
import type { Cliente } from "@/schemas/clientes.schema"

export const getClientes = async (): Promise<Cliente[]> => {
  const rows = await db
    .select()
    .from(customers)
    .orderBy(asc(customers.razonSocial))
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
