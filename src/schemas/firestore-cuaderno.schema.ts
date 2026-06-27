import { z } from "zod"

const s = z.string().nullish()
const num = z.union([z.number(), z.string()]).nullish()
const bln = z.boolean().nullish()
const arrS = z.array(z.string()).nullish()
const arrNum = z.array(z.union([z.number(), z.string()])).nullish()

const panoSchema = z.looseObject({
  id: num,
  nombre: s,
  variedad: s,
  anio: s,
  hectareas: num,
  has_riego: num,
  densidad: num,
  color: s,
  tipo: s,
  panoPadre: s,
  plantas: num,
  deh: num,
  dsh: num,
  portaInjerto: s,
  prodPct: z
    .looseObject({
      sano: num,
      debil: num,
      replante: num,
      muerto: num,
      falta: num,
    })
    .nullish(),
})

const registroSchema = z.looseObject({
  id: num,
  fecha: s,
  panoId: num,
  tipo: s,
  producto: s,
  dosis: num,
  unidad: s,
  metodo: s,
  operador: s,
  obs: s,
  lote: s,
})

const fieldProductSchema = z.looseObject({
  nombre: z.string(),
  tipo: s,
  unidad: s,
  dosis: num,
  ingredienteActivo: s,
  objetivo: s,
  aportes: z.record(z.string(), z.union([z.number(), z.string()])).nullish(),
})

const ordenProductoSchema = z.looseObject({
  nombre: s,
  dosis: num,
  unidad: s,
  unitS: s,
  tProd: num,
  margin: num,
})
const ordenDistribucionSchema = z.looseObject({
  panoId: num,
  panoNombre: s,
  variedad: s,
  anio: s,
  color: s,
  has: num,
  agua: num,
  prod: num,
  prods: z
    .array(
      z.looseObject({ nombre: s, qty: num, unitS: s, unidad: s, dosis: num }),
    )
    .nullish(),
})

const ordenSchema = z.looseObject({
  id: num,
  numero: s,
  fecha: s,
  tipoApp: s,
  fenologico: s,
  objetivos: arrS,
  objetivoOtro: s,
  especie: s,
  responsable: s,
  metodo: s,
  panoIds: arrNum,
  productos: z.array(ordenProductoSchema).nullish(),
  distribucion: z.array(ordenDistribucionSchema).nullish(),
  producto: s,
  dosis: num,
  unidad: s,
  unitS: s,
  moj: num,
  vha: num,
  mojT: num,
  notas: s,
  tHas: num,
  tAgua: num,
  tProd: num,
  margin: num,
  editada: bln,
  editadaFecha: s,
  editadaPor: s,
})

const confirmacionSchema = z.looseObject({
  id: num,
  ordenId: num,
  ordenNumero: s,
  fechaApp: s,
  horaInicio: s,
  horaFin: s,
  operador: s,
  equipo: s,
  turno: s,
  tempAmb: num,
  humedad: num,
  viento: num,
  condClima: s,
  panoIds: arrNum,
  productosReales: z
    .array(
      z.looseObject({
        nombre: s,
        qtyAplicada: num,
        unitS: s,
        planeado: num,
        planeadoUS: s,
        factor: num,
      }),
    )
    .nullish(),
  aguaReal: num,
  notas: s,
  creada: s,
  creadaPor: s,
})

const sectorSchema = z.looseObject({
  id: s,
  nombre: s,
  equipo: s,
  ha: num,
  variedad: s,
  plantas: num,
})
const fertOrdenSchema = z.looseObject({
  id: s,
  numero: s,
  fecha: s,
  forma: s,
  horario: s,
  estado: s,
  responsable: s,
  sectores: arrS,
  lineas: z
    .array(z.looseObject({ prod: s, dosis: num, unidad: s, obs: s }))
    .nullish(),
  confirmada: bln,
  confirmadaFecha: s,
  creado: s,
  modificado: s,
})

const cfgSchema = z
  .looseObject({
    empresa: s,
    temporada: s,
    documento: s,
    obsDefecto: s,
    rangos: z
      .array(z.looseObject({ especie: s, desde: num, hasta: num }))
      .nullish(),
    estados: arrS,
    condiciones: arrS,
    equipos: arrS,
    formas: arrS,
    unidades: arrS,
    horarios: arrS,
    tiposDoc: arrS,
    predios: z.array(z.looseObject({ predio: s, admin: s })).nullish(),
  })
  .nullish()

// Envelope del objeto S (payload de cuaderno/main ya JSON.parseado)
export const cuadernoPayloadSchema = z.looseObject({
  panos: z.array(panoSchema).optional(),
  registros: z.array(registroSchema).optional(),
  productos: z.array(fieldProductSchema).optional(),
  ordenes: z.array(ordenSchema).optional(),
  confirmaciones: z.array(confirmacionSchema).optional(),
  oCounter: num,
  fertirriego: z
    .looseObject({
      sectores: z.array(sectorSchema).optional(),
      ordenes: z.array(fertOrdenSchema).optional(),
      oCounter: num,
      cfg: cfgSchema,
    })
    .nullish(),
  prodPorEstado: z
    .looseObject({
      sano: num,
      debil: num,
      replante: num,
      muerto: num,
      falta: num,
    })
    .nullish(),
})

export type CuadernoPayload = z.infer<typeof cuadernoPayloadSchema>
