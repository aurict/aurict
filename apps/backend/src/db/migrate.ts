import { migrate } from "drizzle-orm/postgres-js/migrator"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createDbClient } from "./client"
import { loadEnv } from "../env"

const env = loadEnv()
const backendDb = createDbClient(env)

if (!backendDb) {
  throw new Error("DATABASE_URL is required to run backend migrations.")
}

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), "../../drizzle")

await migrate(backendDb.db, { migrationsFolder })
await backendDb.close()

console.log("Aurict backend migrations applied.")
