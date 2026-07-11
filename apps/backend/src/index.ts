import { createApp } from "./app"
import { loadEnv } from "./env"

const env = loadEnv()
const app = createApp({ env })

Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
})

console.log(`Aurict backend listening on :${env.PORT}`)
