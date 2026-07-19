import { timingSafeEqual } from "node:crypto"
import { Hono } from "hono"
import { requireAuth } from "../middleware/auth"
import { ApiError } from "../middleware/errors"
import { rateLimit } from "../middleware/rate-limit"
import type { AppBindings } from "../types"

function tokenMatches(actual: string | undefined, expected: string): boolean {
  if (!actual) return false
  const received = Buffer.from(actual)
  const configured = Buffer.from(expected)
  return received.length === configured.length && timingSafeEqual(received, configured)
}

export const presenceRoutes = new Hono<AppBindings>()
  .post("/presence/heartbeat", requireAuth, rateLimit(12, 60_000, "presence-heartbeat"), async (c) => {
    await c.get("repo").touchUserPresence(c.get("user")!.id, new Date())
    return c.json({ ok: true })
  })
  .get("/internal/active-users", async (c) => {
    const token = c.get("env").ACTIVE_USERS_ADMIN_TOKEN
    if (!token) throw new ApiError(404, "Active-user reporting is not configured.", "not_found")
    if (!tokenMatches(c.req.header("x-aurict-admin-token"), token)) {
      throw new ApiError(401, "Invalid active-user reporting token.", "unauthorized")
    }
    const cutoff = new Date(Date.now() - c.get("env").ACTIVE_USERS_WINDOW_SECONDS * 1000)
    const activeUsers = await c.get("repo").countActiveUsers(cutoff)
    return c.json({ ok: true, activeUsers })
  })
