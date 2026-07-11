import type { Context, Next } from "hono"
import { ApiError } from "./errors"
import type { AppBindings } from "../types"

export async function bodyLimit(c: Context<AppBindings>, next: Next) {
  const length = c.req.header("content-length")
  const maxBytes = c.get("env").REQUEST_BODY_LIMIT_BYTES
  if (length && Number(length) > maxBytes) {
    throw new ApiError(413, "Request body is too large.", "payload_too_large")
  }
  await next()
}
