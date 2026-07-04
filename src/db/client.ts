import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import {
  DB_POOL_CONNECTION_TIMEOUT_MS,
  DB_POOL_IDLE_TIMEOUT_MS,
  DB_POOL_MAX,
} from "@/constants/db.constants"
import { env } from "@/lib/env"
import * as schema from "./schema"

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: DB_POOL_MAX,
  idleTimeoutMillis: DB_POOL_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: DB_POOL_CONNECTION_TIMEOUT_MS,
})

export const db = drizzle(pool, { schema })
