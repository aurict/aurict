import { NextResponse } from "next/server"
import { assertSameOrigin, backendRequest, jsonError, normalizeEmail, readJsonBody, safeAuthError } from "@/lib/auth/server"

export async function POST(request: Request) {
  if (!(await assertSameOrigin(request))) return jsonError("Invalid request origin.", 403, "invalid_origin")
  const body = await readJsonBody<{ email?: unknown }>(request)
  if (typeof body?.email !== "string" || body.email.length > 254 || !body.email.includes("@")) return jsonError("A valid email is required.", 400)
  const result = await backendRequest<Record<string, never>>("/auth/password-reset/request", { method: "POST", bodyJson: { email: normalizeEmail(body.email) } })
  // The backend answers the same way for unknown emails; never pass anything else through.
  return NextResponse.json(result.body.ok ? { ok: true } : safeAuthError(result.body, "Could not request a reset email."), { status: result.status })
}
