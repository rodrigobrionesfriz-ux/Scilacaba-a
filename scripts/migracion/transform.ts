import {
    costCenters,
    customers,
    groups,
    movementLines,
    movements,
    productTypes,
    products,
    providers,
    users,
    warehouses,
  } from "@/db/schema"
  import { sciPayloadSchema } from "@/schemas/firestore-sci.schema"
  import {
    boolDefaultFalse,
    boolDefaultTrue,
    parseDateOnly,
    parseEpochMs,
    parseTimestamp,
    rutBody,
    toNumericString,
  } from "@/utils/migracion.utils"
  import type { DocCrudo } from "./firebase"

  export type FilasSci = {
    productTypes: (typeof productTypes.$inferInsert)[]
    groups: (typeof groups.$inferInsert)[]
    warehouses: (typeof warehouses.$inferInsert)[]
    providers: (typeof providers.$inferInsert)[]
    customers: (typeof customers.$inferInsert)[]
    costCenters: (typeof costCenters.$inferInsert)[]
    products: (typeof products.$inferInsert)[]
    users: (typeof users.$inferInsert)[]
    movements: (typeof movements.$inferInsert)[]
    movementLines: (typeof movementLines.$inferInsert)[]
  }

  // Mapea el doc sci/main a filas de DB del slice maestros + inventario.
  // La coerción de tipos vive en @/utils/migracion.utils; los huérfanos (líneas que
  // referencian un producto inexistente) se cubren con un producto placeholder activo=false.
  export const transformSci = (doc: DocCrudo): FilasSci => {
    const p = sciPayloadSchema.parse(doc.payload ?? {})

    const productTypesRows: FilasSci["productTypes"] = (p.productTypes ?? []).map((t) => ({
      nombre: t.nombre,
      descripcion: t.descripcion ?? null,
      activo: boolDefaultTrue(t.activo),
      creadoAt: parseTimestamp(t.creado) ?? undefined,
      modificadoAt: parseTimestamp(t.modificado),
    }))

    const groupsRows: FilasSci["groups"] = (p.groups ?? []).map((g) => ({
      nombre: g.nombre,
      subgrupos: g.subgrupos ?? [],
    }))

    const warehousesRows: FilasSci["warehouses"] = (p.warehouses ?? []).map((w) => ({
      id: w.id,
      nombre: w.nombre ?? w.id,
      direccion: w.direccion ?? null,
      esServicios: boolDefaultFalse(w.esServicios),
      activo: boolDefaultTrue(w.activo),
      creadoAt: parseTimestamp(w.creado) ?? undefined,
    }))

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
      return [{
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
      }]
    }

    const providersRows: FilasSci["providers"] = (p.providers ?? []).flatMap(mapEntidad)
    const customersRows: FilasSci["customers"] = (p.customers ?? []).flatMap(mapEntidad)

    const costCentersRows: FilasSci["costCenters"] = (p.costCenters ?? []).flatMap((c) =>
      c.codigo
        ? [{
            codigo: c.codigo,
            descripcion: c.descripcion ?? "",
            area: c.area ?? null,
            responsable: c.responsable ?? null,
            observaciones: c.observaciones ?? null,
            activo: boolDefaultTrue(c.activo),
            creadoAt: parseTimestamp(c.creado) ?? undefined,
            modificadoAt: parseTimestamp(c.modificado),
          }]
        : [],
    )

    const productsRows: FilasSci["products"] = (p.products ?? []).map((pr) => ({
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
    }))

    const usersRows: FilasSci["users"] = (p.users ?? []).map((u) => ({
      id: u.id,
      nombre: u.nombre ?? u.id,
      role: u.role ?? "consulta",
      permissions: u.permissions ?? [],
      activo: boolDefaultTrue(u.activo),
      creadoAt: parseTimestamp(u.creado) ?? undefined,
      modificadoAt: parseTimestamp(u.modificado),
    }))

    const movementsRows: FilasSci["movements"] = (p.movements ?? []).map((m) => ({
      numero: m.numero,
      direccion: m.tipo === "ENT" ? "ENT" : "SAL",
      tipoMovimiento: m.tipoMovimiento ?? "",
      fecha: parseTimestamp(m.fecha) ?? parseTimestamp(m.creado) ?? new Date(0),
      bodegaId: m.bodegaId ?? "",
      bodegaDestinoId: m.bodegaDestinoId ?? null,
      documento: m.documento ?? null,
      tipoDoc: m.tipoDoc ?? null,
      numeroDoc: m.numeroDoc ?? null,
      proveedorCodigo: m.proveedorCodigo ?? null,
      clienteCodigo: m.clienteCodigo ?? null,
      centroCosto: m.centroCosto ?? null,
      observaciones: m.observaciones ?? null,
      usuario: m.usuario ?? "",
      autorizadoPor: m.autorizadoPor ?? null,
      tomaId: m.tomaId ?? null,
      tomaNumero: m.tomaNumero ?? null,
      anulado: boolDefaultFalse(m.anulado),
      creadoAt: parseTimestamp(m.creado) ?? undefined,
      updatedAt: parseEpochMs(m._mod),
    }))

    const movementLinesRows: FilasSci["movementLines"] = []
    const referidos = new Set<string>()
    for (const m of p.movements ?? []) {
      for (const d of m.detalles ?? []) {
        if (!d.codigoInterno) continue
        referidos.add(d.codigoInterno)
        movementLinesRows.push({
          movementNumero: m.numero,
          codigoInterno: d.codigoInterno,
          descripcion: d.descripcion ?? null,
          unidadMedida: d.unidadMedida ?? null,
          cantidad: toNumericString(d.cantidad),
          costo: toNumericString(d.costo),
          lote: d.lote ?? null,
          fechaVenc: parseDateOnly(d.fechaVenc),
          loteId: d.loteId ?? null,
        })
      }
    }

    // Productos placeholder para códigos referidos por líneas pero ausentes del catálogo.
    const existentes = new Set(productsRows.map((pr) => pr.codigoInterno))
    for (const cod of referidos) {
      if (!existentes.has(cod)) {
        productsRows.push({
          codigoInterno: cod,
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
      }
    }

    return {
      productTypes: productTypesRows,
      groups: groupsRows,
      warehouses: warehousesRows,
      providers: providersRows,
      customers: customersRows,
      costCenters: costCentersRows,
      products: productsRows,
      users: usersRows,
      movements: movementsRows,
      movementLines: movementLinesRows,
    }
  }