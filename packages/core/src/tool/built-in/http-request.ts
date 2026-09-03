import { z } from "zod"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"
import { fetchWithUrlPolicy, readResponseTextLimited } from "../../security/network-policy.js"

const MAX_RESPONSE_BYTES = 2_000_000

export const httpRequestTool: ToolDef = {
  id: "http_request",
  spec: {
    category: "network",
    riskLevel: "medium",
    permissionSummary: "Send an HTTP request",
    requiresConfirmation: (args) => {
      const method = String(args["method"] ?? "GET").toUpperCase()
      return !["GET", "HEAD", "OPTIONS"].includes(method) || args["auth"] !== undefined
    },
  },
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

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
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

    // Already cancelled — short-circuit before arming a timer or a listener that
    // would only be torn down again, and before any request is started.
    if (ctx.signal.aborted) return { output: "", error: "Request cancelled" }

    const controller = new AbortController()
    let timedOut = false
    const onParentAbort = () => controller.abort()
    ctx.signal.addEventListener("abort", onParentAbort, { once: true })
    const timer = setTimeout(() => { timedOut = true; controller.abort() }, timeout)

    const start = Date.now()
    try {
      const request: RequestInit = {
        method,
        headers,
        signal:   controller.signal,
        redirect: (args["follow_redirects"] as boolean ?? true) ? "follow" : "manual",
        ...(bodyStr === undefined ? {} : { body: bodyStr }),
      }
      const res = await fetchWithUrlPolicy(url, request, {
        followRedirects: (args["follow_redirects"] as boolean | undefined) ?? true,
      })

      const resHeaders: Record<string, string> = {}
      res.headers.forEach((v, k) => { resHeaders[k] = v })

      const { text: raw, truncated } = await readResponseTextLimited(res, MAX_RESPONSE_BYTES)
      let body: unknown = raw
      const ct = res.headers.get("content-type") ?? ""
      if (ct.includes("application/json") || (raw.trimStart().startsWith("{") || raw.trimStart().startsWith("["))) {
        try { body = JSON.parse(raw) } catch { body = raw }
      }

      const elapsed = Date.now() - start
      const out: Record<string, unknown> = {
        status:     res.status,
        statusText: res.statusText,
        ok:         res.ok,
        timing_ms:  elapsed,
        headers:    resHeaders,
        body,
        ...(truncated ? { truncated: true } : {}),
      }

      return { output: JSON.stringify(out, null, 2) }
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError"
      if (isAbort && timedOut) return { output: "", error: `Request timed out after ${timeout}ms` }
      if (isAbort && ctx.signal.aborted) return { output: "", error: "Request cancelled" }
      const msg = err instanceof Error ? err.message : String(err)
      return { output: "", error: `Request failed: ${msg}` }
    } finally {
      clearTimeout(timer)
      ctx.signal.removeEventListener("abort", onParentAbort)
    }
  },
}
