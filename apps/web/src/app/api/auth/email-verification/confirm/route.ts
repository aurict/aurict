import { NextResponse } from "next/server"
import { assertSameOrigin, backendRequest, jsonError, readJsonBody, safeAuthError } from "@/lib/auth/server"

export async function POST(request: Request) {
  if (!(await assertSameOrigin(request))) return jsonError("Invalid request origin.", 403, "invalid_origin")
  const body = await readJsonBody<{ token?: unknown }>(request)
  if (typeof body?.token !== "string" || body.token.length < 32 || body.token.length > 512) return jsonError("Verification link is invalid.", 400)
  const result = await backendRequest<Record<string, never>>("/auth/email-verification/confirm", { method: "POST", bodyJson: { token: body.token } })
  return NextResponse.json(result.body.ok ? { ok: true } : safeAuthError(result.body, "Verification link is invalid or expired."), { status: result.status })
}
