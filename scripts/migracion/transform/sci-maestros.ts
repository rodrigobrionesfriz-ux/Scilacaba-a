import {
  costCenters,
  customers,
  groups,
  productTypes,
  products,
  providers,
  users,
  warehouses,
} from "@/db/schema"
import type { SciPayload } from "@/schemas/firestore-sci.schema"
import {
  boolDefaultFalse,
  boolDefaultTrue,
  parseTimestamp,
  rutBody,
  toNumericString,
} from "@/utils/migracion.utils"

export type FilasMaestros = {
  productTypes: (typeof productTypes.$inferInsert)[]
  groups: (typeof groups.$inferInsert)[]
  warehouses: (typeof warehouses.$inferInsert)[]
  providers: (typeof providers.$inferInsert)[]
  customers: (typeof customers.$inferInsert)[]
  costCenters: (typeof costCenters.$inferInsert)[]
  products: (typeof products.$inferInsert)[]
  users: (typeof users.$inferInsert)[]
}

// Maestros del doc sci/main → filas de DB. La coerción de tipos vive en
// @/utils/migracion.utils. Los huérfanos (productos referidos pero ausentes) se
// resuelven en transform/index.ts con la info de inventario + tomas.
export const transformMaestros = (p: SciPayload): FilasMaestros => {
  const productTypesRows: FilasMaestros["productTypes"] = (
    p.productTypes ?? []
  ).map((t) => ({
    nombre: t.nombre,
    descripcion: t.descripcion ?? null,
    activo: boolDefaultTrue(t.activo),
    creadoAt: parseTimestamp(t.creado) ?? undefined,
    modificadoAt: parseTimestamp(t.modificado),
  }))

  const groupsRows: FilasMaestros["groups"] = (p.groups ?? []).map((g) => ({
    nombre: g.nombre,
    subgrupos: g.subgrupos ?? [],
  }))

  const warehousesRows: FilasMaestros["warehouses"] = (p.warehouses ?? []).map(
    (w) => ({
      id: w.id,
      nombre: w.nombre ?? w.id,
      direccion: w.direccion ?? null,
      esServicios: boolDefaultFalse(w.esServicios),
      activo: boolDefaultTrue(w.activo),
      creadoAt: parseTimestamp(w.creado) ?? undefined,
    }),
  )

  const mapEntidad = (e: {
    codigo?: string | null
    razonSocial?: string | null
    rut?: string | null
    giro?: string | null
    direccion?: string | null
    comuna?: string | null
    ciudad?: string | null
    telefono?: string | null
    email?: string | null
    contacto?: string | null
    activo?: boolean | null
    creado?: string | null
    modificado?: string | null
  }) => {
    const codigo = e.codigo ?? rutBody(e.rut)
    if (!codigo) return []
    return [
      {
        codigo,
        razonSocial: e.razonSocial ?? "",
        rut: e.rut ?? null,
        giro: e.giro ?? null,
        direccion: e.direccion ?? null,
        comuna: e.comuna ?? null,
        ciudad: e.ciudad ?? null,
        telefono: e.telefono ?? null,
        email: e.email ?? null,
        contacto: e.contacto ?? null,
        activo: boolDefaultTrue(e.activo),
        creadoAt: parseTimestamp(e.creado) ?? undefined,
        modificadoAt: parseTimestamp(e.modificado),
      },
    ]
  }

  const providersRows: FilasMaestros["providers"] = (p.providers ?? []).flatMap(
    mapEntidad,
  )
  const customersRows: FilasMaestros["customers"] = (p.customers ?? []).flatMap(
    mapEntidad,
  )

  const costCentersRows: FilasMaestros["costCenters"] = (
    p.costCenters ?? []
  ).flatMap((c) =>
    c.codigo
      ? [
          {
            codigo: c.codigo,
            descripcion: c.descripcion ?? "",
            area: c.area ?? null,
            responsable: c.responsable ?? null,
            observaciones: c.observaciones ?? null,
            activo: boolDefaultTrue(c.activo),
            creadoAt: parseTimestamp(c.creado) ?? undefined,
            modificadoAt: parseTimestamp(c.modificado),
          },
        ]
      : [],
  )

  const productsRows: FilasMaestros["products"] = (p.products ?? []).map(
    (pr) => ({
      codigoInterno: pr.codigoInterno,
      codigoEan: pr.codigoEAN ?? null,
      descripcion: pr.descripcion ?? "",
      unidadMedida: pr.unidadMedida ?? "UN",
      tipoProducto: pr.tipoProducto ?? null,
      grupo: pr.grupo ?? null,
      subGrupo: pr.subGrupo ?? null,
      manejaAtributos: boolDefaultFalse(pr.manejaAtributos),
      inventariable: boolDefaultTrue(pr.inventariable),
      stockMinimo: toNumericString(pr.stockMinimo),
      aplicaIva: boolDefaultTrue(pr.aplicaIVA),
      aplicaIec: boolDefaultFalse(pr.aplicaIEC),
      aplicaIla: boolDefaultFalse(pr.aplicaILA),
      ccTipo: pr.ccTipo ?? null,
      ccIngredienteActivo: pr.ccIngredienteActivo ?? null,
      ccObjetivo: pr.ccObjetivo ?? null,
      ccDosis: pr.ccDosis == null ? null : toNumericString(pr.ccDosis),
      ccUnidad: pr.ccUnidad ?? null,
      activo: boolDefaultTrue(pr.activo),
      creadoAt: parseTimestamp(pr.creado) ?? undefined,
      modificadoAt: parseTimestamp(pr.modificado),
    }),
  )

  const usersRows: FilasMaestros["users"] = (p.users ?? []).map((u) => ({
    id: u.id,
    nombre: u.nombre ?? u.id,
    role: u.role ?? "consulta",
    permissions: u.permissions ?? [],
    activo: boolDefaultTrue(u.activo),
    creadoAt: parseTimestamp(u.creado) ?? undefined,
    modificadoAt: parseTimestamp(u.modificado),
  }))

  return {
    productTypes: productTypesRows,
    groups: groupsRows,
    warehouses: warehousesRows,
    providers: providersRows,
    customers: customersRows,
    costCenters: costCentersRows,
    products: productsRows,
    users: usersRows,
  }
}

// Producto placeholder para un código referido por líneas pero ausente del catálogo.
export const placeholderProducto = (
  codigoInterno: string,
): typeof products.$inferInsert => ({
  codigoInterno,
  descripcion: "[MIGRADO-HUÉRFANO]",
  unidadMedida: "UN",
  manejaAtributos: false,
  inventariable: true,
  stockMinimo: "0",
  aplicaIva: true,
  aplicaIec: false,
  aplicaIla: false,
  activo: false,
})
