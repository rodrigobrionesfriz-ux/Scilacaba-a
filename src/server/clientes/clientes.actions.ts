"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db/client"
import { customers } from "@/db/schema"
import { construirExcel } from "@/lib/xlsx"
import { type Cliente, clienteSchema } from "@/schemas/clientes.schema"
import { registrarAuditoria } from "@/server/audit/audit.core"
import { requirePermiso } from "@/server/auth/auth.queries"
import { getClientes } from "@/server/clientes/clientes.queries"
import type { ActionResult } from "@/types/action.types"
import type { ExportResult } from "@/types/export.types"
import { rutValido } from "@/utils/rut.utils"

const aColumnas = (data: Cliente) => ({
  razonSocial: data.razonSocial,
  rut: data.rut || null,
  giro: data.giro || null,
  direccion: data.direccion || null,
  comuna: data.comuna || null,
  ciudad: data.ciudad || null,
  telefono: data.telefono || null,
  email: data.email || null,
  contacto: data.contacto || null,
  activo: data.activo,
})

export const crearCliente = async (input: unknown): Promise<ActionResult> => {
  const usuario = await requirePermiso("clientes.crear")
  const parsed = clienteSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const data = parsed.data
  if (data.rut && !rutValido(data.rut))
    return { ok: false, error: "El RUT (con DV) es inválido" }
  const existe = await db.query.customers.findFirst({
    where: eq(customers.codigo, data.codigo),
  })
  if (existe) return { ok: false, error: "Ya existe un cliente con ese código" }
  await db.insert(customers).values({ codigo: data.codigo, ...aColumnas(data) })
  await registrarAuditoria({
    usuario: usuario.id,
    accion: "cliente.crear",
    detalle: data.razonSocial,
    referencia: data.codigo,
  })
  revalidatePath("/clientes")
  return { ok: true }
}

export const editarCliente = async (
  codigo: string,
  input: unknown,
): Promise<ActionResult> => {
  const usuario = await requirePermiso("clientes.crear")
  const parsed = clienteSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const data = parsed.data
  if (data.rut && !rutValido(data.rut))
    return { ok: false, error: "El RUT (con DV) es inválido" }
  await db
    .update(customers)
    .set({ ...aColumnas(data), modificadoAt: new Date() })
    .where(eq(customers.codigo, codigo))
  await registrarAuditoria({
    usuario: usuario.id,
    accion: "cliente.editar",
    detalle: data.razonSocial,
    referencia: codigo,
  })
  revalidatePath("/clientes")
  return { ok: true }
}

// Exporta los clientes a Excel (generado en el servidor, SPEC).
export const exportarClientesExcel = async (): Promise<ExportResult> => {
  await requirePermiso("clientes.ver")
  const clientes = await getClientes()
  const base64 = await construirExcel([
    {
      nombre: "Clientes",
      columnas: [
        { header: "Código", key: "codigo", width: 14 },
        { header: "Razón social", key: "razonSocial", width: 32 },
        { header: "RUT", key: "rut", width: 14 },
        { header: "Giro", key: "giro", width: 24 },
        { header: "Dirección", key: "direccion", width: 30 },
        { header: "Comuna", key: "comuna", width: 18 },
        { header: "Ciudad", key: "ciudad", width: 18 },
        { header: "Teléfono", key: "telefono", width: 16 },
        { header: "Email", key: "email", width: 26 },
        { header: "Contacto", key: "contacto", width: 22 },
        { header: "Activo", key: "activo", width: 10 },
      ],
      filas: clientes.map((c) => ({ ...c, activo: c.activo ? "Sí" : "No" })),
    },
  ])
  return { ok: true, base64, filename: "clientes.xlsx" }
}
