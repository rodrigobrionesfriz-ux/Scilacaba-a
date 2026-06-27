import "dotenv/config"
import { eq } from "drizzle-orm"
import { db } from "@/db/client"
import { accounts, users } from "@/db/schema"
import { auth } from "@/server/auth/auth"

// Provisión de credenciales (ADR-004, Fase 2). Los usuarios migrados vienen de
// Firebase anónimo: tienen fila en `users` pero ninguna credencial. Este seed crea
// una cuenta "credential" con una password inicial para cada usuario activo que no
// tenga una, vía la API interna de better-auth (mismo path que el sign-up).
// Idempotente: salta a quien ya tiene credencial. La password inicial se entrega
// fuera de banda; el usuario la cambia en /cambiar-password tras el primer login.
//
// Uso:   SEED_PASSWORD="..." pnpm seed:auth
const PASSWORD_INICIAL = process.env.SEED_PASSWORD ?? "Sci.Temporal.2026"

const run = async () => {
  const context = await auth.$context

  const activos = (await db.select().from(users)).filter((u) => u.activo)
  const credenciales = await db
    .select({ userId: accounts.userId })
    .from(accounts)
    .where(eq(accounts.providerId, "credential"))
  const yaTienen = new Set(credenciales.map((c) => c.userId))

  let creados = 0
  for (const u of activos) {
    if (yaTienen.has(u.id)) continue
    const hash = await context.password.hash(PASSWORD_INICIAL)
    await context.internalAdapter.linkAccount({
      userId: u.id,
      providerId: "credential",
      accountId: u.id,
      password: hash,
    })
    creados += 1
    console.log(`  + ${u.email} (${u.role})`)
  }

  const admins = activos.filter((u) => u.role === "admin")
  if (admins.length === 0) {
    console.warn(
      "⚠️  No hay usuarios admin activos. Revisa los datos migrados.",
    )
  }

  console.log(
    `\nSeed auth: ${creados} credencial(es) creada(s); ${yaTienen.size} ya existían. ` +
      `${activos.length} usuario(s) activo(s), ${admins.length} admin(s).`,
  )
  if (creados > 0) {
    console.log(
      `Password inicial entregada: "${PASSWORD_INICIAL}" (cámbiala tras el login).`,
    )
  }
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
