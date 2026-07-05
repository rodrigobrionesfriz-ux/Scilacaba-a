# Compra Urgente + Gestión de Equipos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir a v2 dos features del Cuaderno que trae el monolito `main`: catálogo de nebulizadoras (equipos) con cálculo de estanques en la orden, y una vista de Compra Urgente que cruza en vivo lo requerido por las órdenes vs el stock actual.

**Architecture:** Un slice, una migración (tabla `equipos` + 3 columnas en `application_orders`). Equipos = entity CRUD por capas. Compra Urgente = query de solo lectura derivada (sin persistencia), con la lógica de cruce/agrupación en un util puro testeado. Banner del dashboard diferido.

**Tech Stack:** Next.js 16 (App Router, server components + server actions), Drizzle (pg), zod, better-auth (`requirePermiso`), shadcn/base-ui, vitest.

## Global Constraints

- Estilo: **arrow functions** siempre; **sin `;`** (Prettier `semi:false`); **comillas dobles**; **nunca `any` ni `as`** (usar `z.infer`, `unknown`+narrowing).
- Capas (ADR-013): datos solo en `src/server`/`src/db`; utils puros en `src/utils`; zod en `src/schemas`; tipos en `src/types`; constantes en `src/constants` (nunca inline); páginas ≤20 líneas que componen; componentes de ruta en `(sections)/`.
- 1 componente por archivo. Auditar mutaciones con `registrarAuditoria` (paridad maestros).
- Verde obligatorio: `pnpm typecheck && pnpm lint && pnpm test`.
- Referencia de diseño: `docs/superpowers/specs/2026-07-04-compra-urgente-equipos-design.md`.

---

## File Structure

- `src/db/schema/cuaderno.ts` — MODIFICAR: nueva tabla `equipos` + columnas `equipo`/`equipoCap`/`nEstanques` en `applicationOrders`.
- `drizzle/00NN_*.sql` — CREAR (generado): migración.
- `src/schemas/equipos.schema.ts` — CREAR: zod del equipo.
- `src/types/equipos.types.ts` — CREAR: `EquipoRow`.
- `src/server/equipos/equipos.queries.ts` — CREAR: `getEquipos`.
- `src/server/equipos/equipos.actions.ts` — CREAR: crear/editar/eliminar.
- `src/utils/ordenes.utils.ts` — MODIFICAR: `calcularEstanques`.
- `src/schemas/ordenes.schema.ts` — MODIFICAR: `equipo`/`equipoCap` opcionales.
- `src/server/ordenes/ordenes.actions.ts` — MODIFICAR: persistir equipo + `nEstanques`.
- `src/app/(app)/cuaderno/ordenes/(sections)/ordenes.equipos-dialog.tsx` — CREAR: CRUD nebulizadoras.
- `src/app/(app)/cuaderno/ordenes/(sections)/ordenes.form.tsx` — MODIFICAR: select equipo + preview estanques + botón gestionar.
- `src/types/compras-urgentes.types.ts` — CREAR.
- `src/utils/compras-urgentes.utils.ts` — CREAR: `normalizarNombreProducto` + `construirComprasUrgentes`.
- `src/server/compras-urgentes/compras-urgentes.queries.ts` — CREAR: `getComprasUrgentes`.
- `src/constants/cuaderno.constants.ts` — MODIFICAR: pestaña en `TABS_CUADERNO`.
- `src/app/(app)/cuaderno/compra-urgente/page.tsx` + `(sections)/compra-urgente.view.tsx` — CREAR.
- Tests: `src/utils/ordenes.utils.test.ts` (ampliar), `src/utils/compras-urgentes.utils.test.ts` (crear), `src/schemas/*` (si aplica).

---

## Task 1: Schema DB — tabla `equipos` + columnas de orden + migración

**Files:**
- Modify: `src/db/schema/cuaderno.ts`
- Create: `drizzle/00NN_*.sql` (generado por drizzle-kit)

**Interfaces:**
- Produces: tabla `equipos` `{ id: number, nombre: string, capacidad: string(numeric), activo: boolean, creadoAt }`; columnas `applicationOrders.equipo: string|null`, `.equipoCap: string(numeric)|null`, `.nEstanques: number|null`.

- [ ] **Step 1: Añadir la tabla `equipos` y las columnas de orden**

En `src/db/schema/cuaderno.ts`, añade la tabla (junto a las demás del cuaderno; reutiliza los imports `pgTable`, `bigint`, `text`, `numeric`, `boolean`, `timestamp` ya presentes en el archivo):

```ts
// Catálogo de nebulizadoras (equipos de aplicación). PK epoch-ms (convención cuaderno).
export const equipos = pgTable("equipos", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  nombre: text("nombre").notNull(),
  capacidad: numeric("capacidad", { precision: 18, scale: 4 }).notNull(),
  activo: boolean("activo").notNull().default(true),
  creadoAt: timestamp("creado_at", { withTimezone: true }).notNull().defaultNow(),
})
```

En la definición de `applicationOrders`, añade estas tres columnas antes de `creadoAt`:

```ts
  equipo: text("equipo"),
  equipoCap: numeric("equipo_cap", { precision: 18, scale: 4 }),
  nEstanques: integer("n_estanques"),
```

Asegúrate de que `integer` esté importado desde `drizzle-orm/pg-core` en el `import` del tope del archivo (añádelo si falta).

- [ ] **Step 2: Generar la migración**

Run: `pnpm db:generate`
Expected: crea un archivo nuevo `drizzle/00NN_*.sql` con `CREATE TABLE "equipos"` y `ALTER TABLE "application_orders" ADD COLUMN ...`. Revisa el SQL generado.

- [ ] **Step 3: Verificar typecheck**

Run: `pnpm typecheck`
Expected: PASS (sin errores de tipos por el schema).

- [ ] **Step 4: Commit**

```bash
git add src/db/schema/cuaderno.ts drizzle/
git commit -m "feat(cuaderno): schema equipos + columnas equipo/nEstanques en orden"
```

---

## Task 2: Entity Equipos — schema, tipo, queries, actions

**Files:**
- Create: `src/schemas/equipos.schema.ts`, `src/types/equipos.types.ts`, `src/server/equipos/equipos.queries.ts`, `src/server/equipos/equipos.actions.ts`
- Test: `src/schemas/equipos.schema.test.ts`

**Interfaces:**
- Consumes: tabla `equipos` (Task 1).
- Produces: `equipoSchema`/`Equipo` (`{ nombre: string, capacidad: number, activo: boolean }`); `getEquipos(): Promise<EquipoRow[]>` con `EquipoRow = { id: number, nombre: string, capacidad: number, activo: boolean }`; `crearEquipo(input: unknown)`, `editarEquipo(id: number, input: unknown)`, `eliminarEquipo(id: number)` → `Promise<ActionResult>`.

- [ ] **Step 1: Escribir el test del schema (falla)**

Create `src/schemas/equipos.schema.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { equipoSchema } from "@/schemas/equipos.schema"

describe("equipoSchema", () => {
  it("acepta un equipo válido", () => {
    const r = equipoSchema.safeParse({ nombre: "Nebulizadora 2000L", capacidad: 2000 })
    expect(r.success).toBe(true)
  })
  it("rechaza nombre vacío", () => {
    expect(equipoSchema.safeParse({ nombre: "", capacidad: 2000 }).success).toBe(false)
  })
  it("rechaza capacidad <= 0", () => {
    expect(equipoSchema.safeParse({ nombre: "X", capacidad: 0 }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Correr el test (falla)**

Run: `pnpm test src/schemas/equipos.schema.test.ts`
Expected: FAIL (`equipos.schema` no existe).

- [ ] **Step 3: Crear el schema**

Create `src/schemas/equipos.schema.ts`:

```ts
import { z } from "zod"

// Input del formulario de nebulizadora (regla 13). Soft delete vía `activo`.
export const equipoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  capacidad: z.coerce
    .number({ message: "Capacidad inválida" })
    .positive("La capacidad debe ser mayor que 0"),
  activo: z.boolean().default(true),
})

export type Equipo = z.infer<typeof equipoSchema>
```

- [ ] **Step 4: Correr el test (pasa)**

Run: `pnpm test src/schemas/equipos.schema.test.ts`
Expected: PASS.

- [ ] **Step 5: Crear el tipo de display**

Create `src/types/equipos.types.ts`:

```ts
// Fila de display de nebulizadora (regla 12). Hoja: no importa otras capas.
export type EquipoRow = {
  id: number
  nombre: string
  capacidad: number
  activo: boolean
}
```

- [ ] **Step 6: Crear la query**

Create `src/server/equipos/equipos.queries.ts`:

```ts
import { and, asc, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { equipos } from "@/db/schema"
import type { EquipoRow } from "@/types/equipos.types"

// Nebulizadoras activas, orden alfabético.
export const getEquipos = async (): Promise<EquipoRow[]> => {
  const rows = await db
    .select()
    .from(equipos)
    .where(eq(equipos.activo, true))
    .orderBy(asc(equipos.nombre))
  return rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    capacidad: Number(r.capacidad),
    activo: r.activo,
  }))
}
```

- [ ] **Step 7: Crear las actions**

Create `src/server/equipos/equipos.actions.ts`:

```ts
"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db/client"
import { equipos } from "@/db/schema"
import { type Equipo, equipoSchema } from "@/schemas/equipos.schema"
import { registrarAuditoria } from "@/server/audit/audit.core"
import { requirePermiso } from "@/server/auth/auth.queries"
import type { ActionResult } from "@/types/action.types"

const revalidar = () => revalidatePath("/cuaderno/ordenes")

const aColumnas = (data: Equipo) => ({
  nombre: data.nombre,
  capacidad: String(data.capacidad),
  activo: data.activo,
})

const generarId = async (): Promise<number> => {
  let id = Date.now()
  while (await db.query.equipos.findFirst({ where: eq(equipos.id, id) })) id += 1
  return id
}

export const crearEquipo = async (input: unknown): Promise<ActionResult> => {
  const usuario = await requirePermiso("cuaderno.editar")
  const parsed = equipoSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  const data = parsed.data
  const existe = await db.query.equipos.findFirst({ where: eq(equipos.nombre, data.nombre) })
  if (existe) return { ok: false, error: "Ya existe una nebulizadora con ese nombre" }
  const id = await generarId()
  await db.insert(equipos).values({ id, ...aColumnas(data) })
  await registrarAuditoria({
    usuario: usuario.id,
    accion: "equipo.crear",
    detalle: data.nombre,
    referencia: String(id),
  })
  revalidar()
  return { ok: true }
}

export const editarEquipo = async (id: number, input: unknown): Promise<ActionResult> => {
  const usuario = await requirePermiso("cuaderno.editar")
  const parsed = equipoSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  await db.update(equipos).set(aColumnas(parsed.data)).where(eq(equipos.id, id))
  await registrarAuditoria({
    usuario: usuario.id,
    accion: "equipo.editar",
    detalle: parsed.data.nombre,
    referencia: String(id),
  })
  revalidar()
  return { ok: true }
}

export const eliminarEquipo = async (id: number): Promise<ActionResult> => {
  const usuario = await requirePermiso("cuaderno.editar")
  await db.update(equipos).set({ activo: false }).where(eq(equipos.id, id))
  await registrarAuditoria({
    usuario: usuario.id,
    accion: "equipo.eliminar",
    detalle: String(id),
    referencia: String(id),
  })
  revalidar()
  return { ok: true }
}
```

- [ ] **Step 8: Verificar typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/schemas/equipos.schema.ts src/schemas/equipos.schema.test.ts src/types/equipos.types.ts src/server/equipos/
git commit -m "feat(equipos): schema, tipo, query y actions CRUD de nebulizadoras"
```

---

## Task 3: `calcularEstanques` + integración en la orden

**Files:**
- Modify: `src/utils/ordenes.utils.ts`, `src/schemas/ordenes.schema.ts`, `src/server/ordenes/ordenes.actions.ts`
- Test: `src/utils/ordenes.utils.test.ts` (ampliar)

**Interfaces:**
- Consumes: `calcularDistribucion(...)` (ya devuelve `{ tAgua, ... }`).
- Produces: `calcularEstanques(tAgua: number, capacidad: number): number`; `ordenSchema` ahora incluye `equipo: string` y `equipoCap: number` (opcionales); las columnas persistidas `equipo`, `equipoCap`, `nEstanques`.

- [ ] **Step 1: Escribir el test del util (falla)**

Añade a `src/utils/ordenes.utils.test.ts`:

```ts
import { calcularEstanques } from "@/utils/ordenes.utils"

describe("calcularEstanques", () => {
  it("redondea hacia arriba", () => {
    expect(calcularEstanques(2500, 2000)).toBe(2)
  })
  it("exacto no sobra estanque", () => {
    expect(calcularEstanques(4000, 2000)).toBe(2)
  })
  it("capacidad 0 devuelve 0", () => {
    expect(calcularEstanques(2500, 0)).toBe(0)
  })
})
```

(Si el archivo aún no importa `describe/it/expect`, ya lo hace — es un test existente. Añade solo el import de `calcularEstanques` al bloque de imports de `@/utils/ordenes.utils`.)

- [ ] **Step 2: Correr el test (falla)**

Run: `pnpm test src/utils/ordenes.utils.test.ts`
Expected: FAIL (`calcularEstanques` no existe).

- [ ] **Step 3: Implementar el util**

Añade a `src/utils/ordenes.utils.ts`:

```ts
// N° de estanques de la nebulizadora para el agua total de la orden (monolito: ceil).
export const calcularEstanques = (tAgua: number, capacidad: number): number =>
  capacidad > 0 ? Math.ceil(tAgua / capacidad) : 0
```

- [ ] **Step 4: Correr el test (pasa)**

Run: `pnpm test src/utils/ordenes.utils.test.ts`
Expected: PASS.

- [ ] **Step 5: Añadir equipo al schema de orden**

En `src/schemas/ordenes.schema.ts`, añade dentro de `ordenSchema` (antes de `notas`):

```ts
  equipo: z.string().trim().default(""),
  equipoCap: z.coerce.number({ message: "Capacidad inválida" }).min(0).default(0),
```

- [ ] **Step 6: Persistir equipo + nEstanques en la action**

En `src/server/ordenes/ordenes.actions.ts`, importa el util y amplía `aColumnas`. El objeto que arma `aColumnas` ya usa `calc = calcularDistribucion(...)`; añade estas claves al objeto retornado:

```ts
    equipo: data.equipo || null,
    equipoCap: data.equipoCap > 0 ? String(data.equipoCap) : null,
    nEstanques: data.equipoCap > 0 ? calcularEstanques(calc.tAgua, data.equipoCap) : null,
```

Añade `calcularEstanques` al import existente desde `@/utils/ordenes.utils`.

- [ ] **Step 7: Verificar typecheck + lint + tests**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/utils/ordenes.utils.ts src/utils/ordenes.utils.test.ts src/schemas/ordenes.schema.ts src/server/ordenes/ordenes.actions.ts
git commit -m "feat(ordenes): calcular nº de estanques y persistir equipo en la orden"
```

---

## Task 4: UI — select de nebulizadora + preview + Dialog de gestión

**Files:**
- Create: `src/app/(app)/cuaderno/ordenes/(sections)/ordenes.equipos-dialog.tsx`
- Modify: `src/app/(app)/cuaderno/ordenes/(sections)/ordenes.form.tsx`

**Interfaces:**
- Consumes: `getEquipos` (query), `crearEquipo`/`editarEquipo`/`eliminarEquipo` (actions), `calcularEstanques` (util), `EquipoRow`.
- Produces: en el form, campos controlados `equipo` (nombre) y `equipoCap` (número), y el `EquiposDialog`.

- [ ] **Step 1: Crear el `EquiposDialog`**

Create `src/app/(app)/cuaderno/ordenes/(sections)/ordenes.equipos-dialog.tsx`. Es un componente cliente (`"use client"`) que recibe la lista inicial y permite alta/edición/borrado usando las actions (patrón `useTransition` + `toast` del proyecto). Usa los componentes de `@/components/ui` (`Dialog`, `Button`, `Input`) siguiendo el uso ya presente en `ordenes.confirmar.tsx`/`ordenes.form.tsx`. Estructura:

```tsx
"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  crearEquipo,
  editarEquipo,
  eliminarEquipo,
} from "@/server/equipos/equipos.actions"
import type { EquipoRow } from "@/types/equipos.types"

type EquiposDialogProps = { equipos: EquipoRow[] }

export const EquiposDialog = ({ equipos }: EquiposDialogProps) => {
  const [nombre, setNombre] = useState("")
  const [capacidad, setCapacidad] = useState("")
  const [pending, startTransition] = useTransition()

  const agregar = () => {
    startTransition(async () => {
      const res = await crearEquipo({ nombre, capacidad })
      if (res.ok) {
        toast.success("Nebulizadora creada")
        setNombre("")
        setCapacidad("")
      } else toast.error(res.error)
    })
  }

  const borrar = (id: number) => {
    startTransition(async () => {
      const res = await eliminarEquipo(id)
      if (res.ok) toast.success("Nebulizadora eliminada")
      else toast.error(res.error)
    })
  }

  return (
    <Dialog>
      <DialogTrigger
        render={<Button type="button" variant="secondary" size="sm" nativeButton={false} />}
      >
        Gestionar nebulizadoras
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nebulizadoras</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {equipos.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-2">
              <span className="text-sm">
                {e.nombre} · {e.capacidad} L
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => borrar(e.id)}
              >
                Eliminar
              </Button>
            </div>
          ))}
          <div className="mt-2 flex gap-2">
            <Input
              placeholder="Nombre"
              value={nombre}
              onChange={(ev) => setNombre(ev.target.value)}
            />
            <Input
              type="number"
              placeholder="Capacidad (L)"
              value={capacidad}
              onChange={(ev) => setCapacidad(ev.target.value)}
            />
            <Button type="button" disabled={pending} onClick={agregar}>
              Agregar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

Nota: `nativeButton={false}` en el `DialogTrigger` con `render={<Button/>}` (patrón base-ui del proyecto). La edición inline de existentes puede añadirse igual que el alta si se requiere; el mínimo viable es listar + agregar + eliminar. `editarEquipo` queda disponible para una iteración posterior (no bloquea).

- [ ] **Step 2: Integrar en el formulario de orden**

En `src/app/(app)/cuaderno/ordenes/(sections)/ordenes.form.tsx`:
1. El form necesita la lista de equipos. Como el form es cliente, recibe `equipos: EquipoRow[]` por props desde su vista contenedora (server). Añade la prop `equipos` al tipo de props del form y pásala desde `ordenes.view.tsx` (que ya es server y llama queries — añade `const equipos = await getEquipos()` y pásalo al form/tabla según cómo se monte el form). Sigue el cableado existente por el que la view provee datos al form.
2. Estado controlado: `const [equipoNombre, setEquipoNombre] = useState("")` y deriva `equipoCap` del equipo elegido.
3. Añade un `<Select>` de base-ui (mismo patrón que los otros selects del form, con `items={...}` — ver `sci-baseui-select-items`) cuyas opciones sean `equipos.map(e => ({ value: e.nombre, label: `${e.nombre} (${e.capacidad} L)` }))`. Al cambiar, set `equipoNombre` y busca la capacidad.
4. Muestra el preview: `N° de estanques ≈ {calcularEstanques(tAguaPreview, equipoCap)}` usando el agua total que el form ya calcula para su preview de distribución (reutiliza esa variable; si el form no la expone, calcula con `calcularDistribucion` como ya hace para el preview).
5. Junto al select, renderiza `<EquiposDialog equipos={equipos} />`.
6. Al enviar, incluye `equipo: equipoNombre` y `equipoCap` en el payload que se valida con `ordenSchema` y se manda a `crearOrden`/`editarOrden`.

- [ ] **Step 3: Verificar typecheck + lint + build**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: PASS (build compila el nuevo componente cliente).

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/cuaderno/ordenes/(sections)/"
git commit -m "feat(ordenes): UI selección de nebulizadora, preview de estanques y gestión"
```

---

## Task 5: Compra Urgente — util puro + query

**Files:**
- Create: `src/types/compras-urgentes.types.ts`, `src/utils/compras-urgentes.utils.ts`, `src/server/compras-urgentes/compras-urgentes.queries.ts`
- Test: `src/utils/compras-urgentes.utils.test.ts`

**Interfaces:**
- Consumes: `getStockResumenPorProducto(): Promise<StockResumenProducto[]>` (`{ codigoInterno, cantidad, valor }`); `aProductosOrden(blob: unknown): ProductoOrden[]` (`ProductoOrden` tiene `{ nombre, unidad, tProd, ... }`); `products` (codigoInterno, descripcion).
- Produces: `normalizarNombreProducto(s: string): string`; `construirComprasUrgentes(ordenes, codigoPorNombre, stockPorCodigo): CompraUrgente[]`; `getComprasUrgentes(): Promise<CompraUrgente[]>`.

- [ ] **Step 1: Crear los tipos**

Create `src/types/compras-urgentes.types.ts`:

```ts
// Faltante de un producto para una orden concreta (regla 12). Hoja.
export type OrdenFaltante = {
  id: number
  numero: string
  fecha: string
  requerido: number
  falta: number
}

// Producto agrupado en la lista de Compra Urgente (suma de faltantes por orden).
export type CompraUrgente = {
  producto: string
  unidad: string
  disponible: number
  enBodega: boolean
  totalFalta: number
  ordenes: OrdenFaltante[]
}
```

- [ ] **Step 2: Escribir el test del util (falla)**

Create `src/utils/compras-urgentes.utils.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import {
  construirComprasUrgentes,
  normalizarNombreProducto,
  type OrdenParaCU,
} from "@/utils/compras-urgentes.utils"

describe("normalizarNombreProducto", () => {
  it("mayúsculas, trim y colapsa espacios", () => {
    expect(normalizarNombreProducto("  aceite  agrícola ")).toBe("ACEITE AGRÍCOLA")
  })
})

describe("construirComprasUrgentes", () => {
  const ordenes: OrdenParaCU[] = [
    {
      id: 1,
      numero: "OA-00001",
      fecha: "2026-01-10",
      productos: [{ nombre: "Aceite", unidad: "L/100L", tProd: 30 }],
    },
  ]
  it("marca faltante cuando el stock no cubre lo requerido", () => {
    const cod = new Map([["ACEITE", "P001"]])
    const stock = new Map([["P001", 10]])
    const r = construirComprasUrgentes(ordenes, cod, stock)
    expect(r).toHaveLength(1)
    expect(r[0].producto).toBe("Aceite")
    expect(r[0].disponible).toBe(10)
    expect(r[0].enBodega).toBe(true)
    expect(r[0].totalFalta).toBe(20)
    expect(r[0].ordenes[0].falta).toBe(20)
  })
  it("sin match en catálogo → no está en bodega, todo es falta", () => {
    const r = construirComprasUrgentes(ordenes, new Map(), new Map())
    expect(r[0].enBodega).toBe(false)
    expect(r[0].disponible).toBe(0)
    expect(r[0].totalFalta).toBe(30)
  })
  it("stock suficiente → no aparece", () => {
    const cod = new Map([["ACEITE", "P001"]])
    const stock = new Map([["P001", 100]])
    expect(construirComprasUrgentes(ordenes, cod, stock)).toHaveLength(0)
  })
})
```

- [ ] **Step 3: Correr el test (falla)**

Run: `pnpm test src/utils/compras-urgentes.utils.test.ts`
Expected: FAIL (util no existe).

- [ ] **Step 4: Implementar el util**

Create `src/utils/compras-urgentes.utils.ts`:

```ts
import type { CompraUrgente, OrdenFaltante } from "@/types/compras-urgentes.types"

// Producto de una orden reducido a lo que necesita el cruce con stock.
export type ProductoOrdenCU = { nombre: string; unidad: string; tProd: number }
export type OrdenParaCU = {
  id: number
  numero: string
  fecha: string
  productos: ProductoOrdenCU[]
}

// Normalización de nombre para el match producto↔catálogo (igual que el monolito).
export const normalizarNombreProducto = (s: string): string =>
  s.trim().replace(/\s+/g, " ").toUpperCase()

// Cruza lo requerido por cada orden vs el stock actual y agrupa por producto.
// disponible = stock total actual del producto (mismo valor entre órdenes);
// totalFalta = suma de faltantes por orden (semántica del monolito: cada orden
// necesita su propio suministro). Sin match en catálogo → "no está en bodega".
export const construirComprasUrgentes = (
  ordenes: OrdenParaCU[],
  codigoPorNombre: Map<string, string>,
  stockPorCodigo: Map<string, number>,
): CompraUrgente[] => {
  const grupos = new Map<string, CompraUrgente>()
  for (const orden of ordenes) {
    for (const p of orden.productos) {
      const requerido = p.tProd
      if (!(requerido > 0)) continue
      const codigo = codigoPorNombre.get(normalizarNombreProducto(p.nombre))
      const enBodega = codigo !== undefined
      const disponible = codigo ? (stockPorCodigo.get(codigo) ?? 0) : 0
      const falta = requerido - disponible
      if (!(falta > 0)) continue
      const clave = normalizarNombreProducto(p.nombre)
      const existente = grupos.get(clave)
      const detalle: OrdenFaltante = {
        id: orden.id,
        numero: orden.numero,
        fecha: orden.fecha,
        requerido,
        falta,
      }
      if (existente) {
        existente.totalFalta += falta
        existente.ordenes.push(detalle)
      } else {
        grupos.set(clave, {
          producto: p.nombre,
          unidad: p.unidad,
          disponible,
          enBodega,
          totalFalta: falta,
          ordenes: [detalle],
        })
      }
    }
  }
  return [...grupos.values()].sort((a, b) => b.totalFalta - a.totalFalta)
}
```

- [ ] **Step 5: Correr el test (pasa)**

Run: `pnpm test src/utils/compras-urgentes.utils.test.ts`
Expected: PASS.

- [ ] **Step 6: Crear la query**

Create `src/server/compras-urgentes/compras-urgentes.queries.ts`:

```ts
import { asc } from "drizzle-orm"
import { db } from "@/db/client"
import { applicationOrders, products } from "@/db/schema"
import { getStockResumenPorProducto } from "@/server/stock/stock.queries"
import type { CompraUrgente } from "@/types/compras-urgentes.types"
import {
  construirComprasUrgentes,
  normalizarNombreProducto,
  type OrdenParaCU,
} from "@/utils/compras-urgentes.utils"
import { aProductosOrden } from "@/utils/ordenes.utils"

// Lista de Compra Urgente calculada EN VIVO: órdenes vigentes vs stock actual.
export const getComprasUrgentes = async (): Promise<CompraUrgente[]> => {
  const [ordenesRows, prods, stockResumen] = await Promise.all([
    db
      .select({
        id: applicationOrders.id,
        numero: applicationOrders.numero,
        fecha: applicationOrders.fecha,
        productos: applicationOrders.productos,
      })
      .from(applicationOrders)
      .orderBy(asc(applicationOrders.fecha)),
    db.select({ codigoInterno: products.codigoInterno, descripcion: products.descripcion }).from(products),
    getStockResumenPorProducto(),
  ])

  const codigoPorNombre = new Map(
    prods.map((p) => [normalizarNombreProducto(p.descripcion), p.codigoInterno]),
  )
  const stockPorCodigo = new Map(stockResumen.map((s) => [s.codigoInterno, s.cantidad]))

  const ordenes: OrdenParaCU[] = ordenesRows.map((o) => ({
    id: o.id,
    numero: o.numero,
    fecha: o.fecha ?? "",
    productos: aProductosOrden(o.productos).map((p) => ({
      nombre: p.nombre,
      unidad: p.unidad,
      tProd: p.tProd,
    })),
  }))

  return construirComprasUrgentes(ordenes, codigoPorNombre, stockPorCodigo)
}
```

Nota: verifica que `aProductosOrden` devuelva items con `{ nombre, unidad, tProd }` (lo hace — ver `src/utils/ordenes.utils.ts`). Si algún nombre de campo difiere, ajústalo aquí.

- [ ] **Step 7: Verificar typecheck + lint + tests**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/types/compras-urgentes.types.ts src/utils/compras-urgentes.utils.ts src/utils/compras-urgentes.utils.test.ts src/server/compras-urgentes/
git commit -m "feat(compra-urgente): util de cruce y query en vivo órdenes vs stock"
```

---

## Task 6: Compra Urgente — pestaña y vista

**Files:**
- Modify: `src/constants/cuaderno.constants.ts`
- Create: `src/app/(app)/cuaderno/compra-urgente/page.tsx`, `src/app/(app)/cuaderno/compra-urgente/(sections)/compra-urgente.view.tsx`

**Interfaces:**
- Consumes: `getComprasUrgentes()`, `requirePermiso("cuaderno.ver")`, `CompraUrgente`.

- [ ] **Step 1: Añadir la pestaña**

En `src/constants/cuaderno.constants.ts`, añade al arreglo `TABS_CUADERNO` (antes de `Fertirriego` o al final):

```ts
  { href: "/cuaderno/compra-urgente", label: "Compra Urgente" },
```

- [ ] **Step 2: Crear la página (server, ≤20 líneas)**

Create `src/app/(app)/cuaderno/compra-urgente/page.tsx`:

```tsx
import { CompraUrgenteView } from "./(sections)/compra-urgente.view"

const CompraUrgentePage = () => <CompraUrgenteView />

export default CompraUrgentePage
```

- [ ] **Step 3: Crear la vista (server component)**

Create `src/app/(app)/cuaderno/compra-urgente/(sections)/compra-urgente.view.tsx`:

```tsx
import { requirePermiso } from "@/server/auth/auth.queries"
import { getComprasUrgentes } from "@/server/compras-urgentes/compras-urgentes.queries"

export const CompraUrgenteView = async () => {
  await requirePermiso("cuaderno.ver")
  const items = await getComprasUrgentes()

  if (items.length === 0)
    return (
      <p className="p-6 text-sm text-muted-foreground">
        No hay productos con faltante para las órdenes vigentes.
      </p>
    )

  return (
    <div className="flex flex-col gap-4 p-4">
      {items.map((item) => (
        <div key={item.producto} className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{item.producto}</h3>
            <span className="text-sm font-medium text-destructive">
              Comprar ≈ {item.totalFalta} {item.unidad}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.enBodega
              ? `Disponible: ${item.disponible} ${item.unidad}`
              : "No está en bodega"}
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {item.ordenes.map((o) => (
              <li key={o.id} className="flex justify-between">
                <span>
                  {o.numero} · {o.fecha}
                </span>
                <span className="text-muted-foreground">
                  requiere {o.requerido} · falta {o.falta}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Verificar typecheck + lint + build**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: PASS; la ruta `/cuaderno/compra-urgente` aparece en el output del build.

- [ ] **Step 5: Commit**

```bash
git add src/constants/cuaderno.constants.ts "src/app/(app)/cuaderno/compra-urgente/"
git commit -m "feat(compra-urgente): pestaña y vista agrupada por producto"
```

---

## Task 7: Migración en develop, verificación e2e y PR

**Files:** ninguno (operativo).

- [ ] **Step 1: Aplicar la migración en develop**

Run: `pnpm db:migrate` (con `.env` apuntando a la DB develop)
Expected: aplica la migración nueva sin error (crea `equipos`, añade columnas).

- [ ] **Step 2: Suite verde completa**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: todo PASS.

- [ ] **Step 3: Verificación e2e (deploy develop o `pnpm start` local)**

- Crear una nebulizadora desde el formulario de orden (Dialog "Gestionar nebulizadoras").
- Crear/editar una orden eligiendo la nebulizadora → verificar que se guarda y que el preview de nº de estanques = `ceil(tAgua/capacidad)`.
- Crear una orden que requiera más de lo disponible en stock → abrir `/cuaderno/compra-urgente` y ver el producto agrupado con requerido/disponible/falta.
- Registrar un movimiento de entrada que suba el stock de ese producto → refrescar la vista y verificar que el faltante baja/desaparece (prueba del cálculo EN VIVO).

- [ ] **Step 4: Push + PR a develop**

```bash
git push -u origin feat/cuaderno-compra-urgente-equipos
gh pr create --base develop --title "feat(cuaderno): Compra Urgente + gestión de nebulizadoras" --body "Implementa los ítems 5 y 6 de docs/gap-monolito-main.md. Ver spec en docs/superpowers/specs/2026-07-04-compra-urgente-equipos-design.md."
```

Espera CI verde antes de mergear.

---

## Self-Review (cobertura del spec)

- Equipos: tabla (T1) + entity CRUD (T2) + cálculo estanques + persistencia (T3) + UI (T4). ✓
- Compra Urgente en vivo: util+query (T5) + pestaña/vista (T6); sin persistencia. ✓
- Migración única (T1). ✓ · Banner dashboard diferido (no incluido, por diseño). ✓
- Match producto→stock por nombre aislado en util puro testeado (T5). ✓
- Reglas de estilo/capas/auditoría reflejadas en cada task. ✓
- Riesgo abierto: el match por nombre puede no cubrir todos los casos reales → validar en T7 e2e con datos de develop; si falla, iterar el normalizador (no bloquea el resto).
