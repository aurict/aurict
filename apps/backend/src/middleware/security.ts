import type { Context, Next } from "hono"
import type { AppBindings } from "../types"

const allowedHeaders = "authorization,content-type,x-request-id"
const allowedMethods = "GET,POST,DELETE,OPTIONS"

export async function securityHeaders(c: Context<AppBindings>, next: Next) {
  c.header("x-content-type-options", "nosniff")
  c.header("referrer-policy", "no-referrer")
  c.header("permissions-policy", "camera=(), microphone=(), geolocation=()")
  c.header("cache-control", "no-store")
  if (c.get("env").NODE_ENV === "production") {
    c.header("strict-transport-security", "max-age=31536000; includeSubDomains")
  }
  await next()
}

export async function corsPolicy(c: Context<AppBindings>, next: Next) {
  const origin = c.req.header("origin")
  const allowedOrigins = parseOrigins(c.get("env").CORS_ORIGINS)
  if (origin && allowedOrigins.has(origin)) {
    c.header("access-control-allow-origin", origin)
    c.header("access-control-allow-credentials", "true")
    c.header("access-control-allow-methods", allowedMethods)
    c.header("access-control-allow-headers", allowedHeaders)
    c.header("access-control-max-age", "600")
    c.header("vary", "Origin")
  }
  if (c.req.method === "OPTIONS") return c.body(null, 204)
  await next()
}

function parseOrigins(value: string): Set<string> {
  return new Set(value.split(",").map((origin) => origin.trim()).filter(Boolean))
}
