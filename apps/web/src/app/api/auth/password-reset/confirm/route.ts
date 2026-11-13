import { NextResponse } from "next/server"
import { assertSameOrigin, backendRequest, jsonError, readJsonBody, safeAuthError } from "@/lib/auth/server"

export async function POST(request: Request) {
  if (!(await assertSameOrigin(request))) return jsonError("Invalid request origin.", 403, "invalid_origin")
  const body = await readJsonBody<{ token?: unknown; password?: unknown }>(request)
  if (typeof body?.token !== "string" || body.token.length < 32 || body.token.length > 512) return jsonError("Reset link is invalid.", 400)
  if (typeof body.password !== "string" || body.password.length < 10 || body.password.length > 256) return jsonError("Password must be 10 to 256 characters.", 400)
  const result = await backendRequest<Record<string, never>>("/auth/password-reset/confirm", { method: "POST", bodyJson: { token: body.token, password: body.password } })
  return NextResponse.json(result.body.ok ? { ok: true } : safeAuthError(result.body, "Reset link is invalid or expired."), { status: result.status })
}
