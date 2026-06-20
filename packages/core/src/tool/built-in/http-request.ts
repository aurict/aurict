import { z } from "zod"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

export const httpRequestTool: ToolDef = {
  id: "http_request",
  description: `Make HTTP requests to any URL. Supports all methods, headers, auth, and body.

USE FOR:
- Testing API endpoints you've built
- Calling external APIs during development
- Debugging authentication flows
- Fetching data to process

RETURNS: status code, response headers, body (auto-parsed JSON), timing.`,

  parameters: z.object({
    url:     z.string().describe("Full URL including protocol"),
    method:  z.enum(["GET","POST","PUT","PATCH","DELETE","HEAD","OPTIONS"]).default("GET"),
    headers: z.record(z.string()).optional().describe("Request headers as key-value pairs"),
    body:    z.union([z.string(), z.record(z.unknown())]).optional().describe("Request body — string or JSON object"),
    auth:    z.object({
      type:     z.enum(["bearer","basic"]),
      token:    z.string().optional().describe("Bearer token"),
      username: z.string().optional(),
      password: z.string().optional(),
    }).optional(),
    timeout: z.number().default(30000).describe("Timeout in ms (default 30s)"),
    follow_redirects: z.boolean().default(true),
  }),

  async execute(args): Promise<ExecuteResult> {
    const url    = String(args["url"])
    const method = String(args["method"] ?? "GET").toUpperCase()
    const timeout = Number(args["timeout"] ?? 30000)

    const headers: Record<string, string> = { ...(args["headers"] as Record<string, string> | undefined) }

    // Auth
    const auth = args["auth"] as { type: string; token?: string; username?: string; password?: string } | undefined
    if (auth) {
      if (auth.type === "bearer" && auth.token) {
        headers["Authorization"] = `Bearer ${auth.token}`
      } else if (auth.type === "basic" && auth.username) {
        const encoded = Buffer.from(`${auth.username}:${auth.password ?? ""}`).toString("base64")
        headers["Authorization"] = `Basic ${encoded}`
      }
    }

    // Body
    let bodyStr: string | undefined
    const rawBody = args["body"]
    if (rawBody !== undefined && rawBody !== null) {
      if (typeof rawBody === "object") {
        bodyStr = JSON.stringify(rawBody)
        if (!headers["Content-Type"] && !headers["content-type"]) {
          headers["Content-Type"] = "application/json"
        }
      } else {
        bodyStr = String(rawBody)
      }
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    const start = Date.now()
    let res: Response
    try {
      res = await fetch(url, {
        method,
        headers,
        body:     bodyStr,
        signal:   controller.signal,
        redirect: (args["follow_redirects"] as boolean ?? true) ? "follow" : "manual",
      })
    } catch (err: unknown) {
      clearTimeout(timer)
      const msg = err instanceof Error ? err.message : String(err)
      return { output: "", error: `Request failed: ${msg}` }
    } finally {
      clearTimeout(timer)
    }

    const elapsed = Date.now() - start
    const resHeaders: Record<string, string> = {}
    res.headers.forEach((v, k) => { resHeaders[k] = v })

    const raw = await res.text()
    let body: unknown = raw
    const ct = res.headers.get("content-type") ?? ""
    if (ct.includes("application/json") || (raw.trimStart().startsWith("{") || raw.trimStart().startsWith("["))) {
      try { body = JSON.parse(raw) } catch { body = raw }
    }

    const out: Record<string, unknown> = {
      status:     res.status,
      statusText: res.statusText,
      ok:         res.ok,
      timing_ms:  elapsed,
      headers:    resHeaders,
      body,
    }

    return { output: JSON.stringify(out, null, 2) }
  },
}
