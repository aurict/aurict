import { defineConfig } from "drizzle-kit"
import { join } from "path"
import { homedir } from "os"

export default defineConfig({
  schema: "./packages/core/src/storage/schema.ts",
  out: "./packages/core/src/storage/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: join(homedir(), ".aurict", "aurict.db"),
  },
})
