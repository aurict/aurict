import { createApp } from "./app"
import { loadEnv } from "./env"
import { createMemoryMetrics } from "./observability/metrics"

const env = loadEnv()
const metrics = createMemoryMetrics()
const app = createApp({ env, metrics })

Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
})

console.log(`Aurict backend listening on :${env.PORT}`)

if (env.METRICS_PORT) {
  // Internal-only listener for the monitoring agent; it has no route through the public edge.
  Bun.serve({
    port: env.METRICS_PORT,
    fetch(request) {
      if (new URL(request.url).pathname !== "/metrics") return new Response("not found", { status: 404 })
      return new Response(metrics.prometheus(), { headers: { "content-type": "text/plain; version=0.0.4" } })
    },
  })
  console.log(`Aurict backend metrics on :${env.METRICS_PORT}/metrics`)
}
