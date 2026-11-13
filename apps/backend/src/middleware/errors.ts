import type { Context, Next } from "hono"
import { HTTPException } from "hono/http-exception"
import { ZodError } from "zod"
import type { AppBindings } from "../types"
import { newId } from "../crypto/ids"
import { countEvent } from "../observability/metrics"

export class ApiError extends Error {
  constructor(public status: number, message: string, public code = "error") {
    super(message)
  }
}

export async function requestContext(c: Context<AppBindings>, next: Next) {
  const requestId = c.req.header("x-request-id")
  c.set("requestId", requestId && /^[A-Za-z0-9._-]{1,128}$/.test(requestId) ? requestId : newId("req"))
  await next()
}

export function errorResponse(c: Context<AppBindings>, error: unknown) {
  const requestId = c.get("requestId") ?? newId("req")
  if (error instanceof ApiError) {
    countEvent(error.code)
    return c.json({ ok: false, error: { code: error.code, message: error.message, requestId } }, error.status as never)
  }
  if (error instanceof HTTPException) {
    return c.json({ ok: false, error: { code: "http_error", message: error.message, requestId } }, error.status as never)
  }
  // c.req.json() throws a SyntaxError for malformed bodies; that is the client's mistake.
  if (error instanceof SyntaxError) {
    return c.json({ ok: false, error: { code: "invalid_json", message: "Request body is not valid JSON.", requestId } }, 400)
  }
  if (error instanceof ZodError) {
    return c.json({
      ok: false,
      error: {
        code: "validation_error",
        message: "Request validation failed.",
        requestId,
        issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      },
    }, 400)
  }
  const message = c.get("env")?.NODE_ENV === "production"
    ? "Internal server error"
    : error instanceof Error ? error.message : "Internal server error"
  return c.json({ ok: false, error: { code: "internal_error", message, requestId } }, 500)
}
