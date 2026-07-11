import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js"
import postgres, { type Sql } from "postgres"
import type { BackendEnv } from "../env"
import * as schema from "./schema"

export type BackendDb = {
  client: Sql
  db: PostgresJsDatabase<typeof schema>
  ping: () => Promise<void>
  close: () => Promise<void>
}

export function createDbClient(env: BackendEnv): BackendDb | undefined {
  if (!env.DATABASE_URL) return undefined
  const client = postgres(env.DATABASE_URL, {
    max: env.DATABASE_MAX_CONNECTIONS,
    idle_timeout: env.DATABASE_IDLE_TIMEOUT_SECONDS,
    connect_timeout: env.DATABASE_CONNECT_TIMEOUT_SECONDS,
    prepare: false,
  })
  const db = drizzle(client, { schema })
  return {
    client,
    db,
    async ping() {
      await client`select 1`
    },
    async close() {
      await client.end({ timeout: 5 })
    },
  }
}
