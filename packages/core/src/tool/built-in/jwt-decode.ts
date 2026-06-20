import { z } from "zod"
import type { ToolDef, ExecuteResult } from "../types.js"

export const jwtDecodeTool: ToolDef = {
  id: "jwt_decode",
  description: `Decode and inspect a JWT token without verifying the signature.

USE FOR:
- Inspecting token payload (user ID, roles, permissions)
- Checking expiry (exp) and issued-at (iat) times
- Debugging auth flows — see exactly what claims the token carries

Does NOT verify signature — no secret needed.`,

  parameters: z.object({
    token: z.string().describe("The JWT token string (with or without 'Bearer ' prefix)"),
  }),

  async execute(args): Promise<ExecuteResult> {
    let token = String(args["token"] ?? "").trim()
    if (token.toLowerCase().startsWith("bearer ")) {
      token = token.slice(7).trim()
    }

    const parts = token.split(".")
    if (parts.length !== 3) {
      return { output: "", error: `Invalid JWT: expected 3 parts separated by '.', got ${parts.length}` }
    }

    function decodeBase64Url(s: string): unknown {
      const padded = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(s.length + (4 - s.length % 4) % 4, "=")
      const decoded = Buffer.from(padded, "base64").toString("utf8")
      return JSON.parse(decoded)
    }

    let header: unknown, payload: unknown
    try { header  = decodeBase64Url(parts[0]!) } catch { return { output: "", error: "Failed to decode JWT header" } }
    try { payload = decodeBase64Url(parts[1]!) } catch { return { output: "", error: "Failed to decode JWT payload" } }

    const p = payload as Record<string, unknown>
    const now = Math.floor(Date.now() / 1000)

    let expiryStatus = "no expiry"
    let expiryFormatted: string | undefined
    if (typeof p["exp"] === "number") {
      expiryFormatted = new Date(p["exp"] * 1000).toISOString()
      expiryStatus = p["exp"] < now ? `EXPIRED ${Math.round((now - p["exp"]) / 60)}m ago` : `valid for ${Math.round((p["exp"] - now) / 60)}m`
    }

    let issuedFormatted: string | undefined
    if (typeof p["iat"] === "number") {
      issuedFormatted = new Date(p["iat"] * 1000).toISOString()
    }

    const result: Record<string, unknown> = {
      header,
      payload,
      meta: {
        expiry_status: expiryStatus,
        ...(expiryFormatted  ? { expires_at: expiryFormatted  } : {}),
        ...(issuedFormatted  ? { issued_at:  issuedFormatted  } : {}),
        signature: "(not verified — secret not required for inspection)",
      },
    }

    return { output: JSON.stringify(result, null, 2) }
  },
}
