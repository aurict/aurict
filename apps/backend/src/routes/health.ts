import { Hono } from "hono"
import { publicKeyJwk } from "../crypto/tokens"
import { ApiError } from "../middleware/errors"
import { openApiDocument } from "../openapi"
import type { AppBindings } from "../types"

export const healthRoutes = new Hono<AppBindings>()
  .get("/health", (c) => c.json({ ok: true, service: "aurict-backend" }))
  .get("/.well-known/jwks.json", async (c) => {
    const jwk = await publicKeyJwk(c.get("env"))
    return c.json({ keys: jwk ? [jwk] : [] })
  })
  .get("/ready", async (c) => {
    const db = c.get("db")
    if (!db) return c.json({ ok: true, db: "disabled" })
    await db.ping()
    return c.json({ ok: true, db: "ok" })
  })
  .get("/metrics", (c) => {
    const token = c.get("env").METRICS_TOKEN
    if (token && c.req.header("authorization") !== `Bearer ${token}`) {
      throw new ApiError(401, "Metrics token is required.", "unauthorized")
    }
    if (!token && c.get("env").NODE_ENV === "production") {
      throw new ApiError(404, "Not found.", "not_found")
    }
    return c.json({ ok: true, metrics: c.get("metrics").snapshot() })
  })
  .get("/openapi.json", (c) => {
    if (c.get("env").NODE_ENV === "production" && !c.get("env").PUBLIC_OPENAPI) {
      throw new ApiError(404, "Not found.", "not_found")
    }
    return c.json(openApiDocument)
  })
