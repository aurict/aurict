import type { Context, Next } from "hono"
import { verifyAccessToken } from "../crypto/tokens"
import { ApiError } from "./errors"
import type { AppBindings } from "../types"

export async function requireAuth(c: Context<AppBindings>, next: Next) {
  const header = c.req.header("authorization") ?? ""
  const token = header.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) throw new ApiError(401, "Missing bearer token.", "unauthorized")
  const claims = await verifyAccessToken(token, c.get("env"))
  if (!claims) throw new ApiError(401, "Invalid or expired bearer token.", "unauthorized")
  const user = await c.get("repo").getUser(claims.sub)
  if (!user || user.disabledAt) throw new ApiError(401, "User is unavailable.", "unauthorized")
  // Revocation (password reset, logout-all, refresh token reuse) moves this cutoff forward, so
  // access tokens issued before it stop working immediately instead of at their expiry.
  if (user.tokensValidAfter && claims.iat < Math.floor(user.tokensValidAfter.getTime() / 1000)) {
    throw new ApiError(401, "Invalid or expired bearer token.", "unauthorized")
  }
  c.set("user", user)
  await next()
}
