import type { Context, Next } from "hono"
import { bodyLimit as streamingBodyLimit } from "hono/body-limit"
import { ApiError } from "./errors"
import type { AppBindings } from "../types"

/**
 * Rejects bodies over REQUEST_BODY_LIMIT_BYTES. Hono's limiter also counts chunked bodies as
 * they stream, so a missing or understated Content-Length does not get past it.
 */
export async function bodyLimit(c: Context<AppBindings>, next: Next) {
  const limiter = streamingBodyLimit({
    maxSize: c.get("env").REQUEST_BODY_LIMIT_BYTES,
    onError: () => {
      throw new ApiError(413, "Request body is too large.", "payload_too_large")
    },
  })
  return limiter(c, next)
}
