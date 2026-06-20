import { z } from "zod"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

const MAX_CHARS = 50_000
const TIMEOUT_MS = 30_000

// Basit HTML → düz metin: tag sil, entity decode et, boşlukları normalize et
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export const webfetchTool: ToolDef = {
  id:          "webfetch",
  description: "Fetch a URL and return its content as text. Use format='text' for raw HTML, 'markdown' (default) for readable plain text.",
  parameters:  z.object({
    url:    z.string().describe("URL to fetch (must start with http:// or https://)"),
    format: z.enum(["markdown", "text"]).optional().describe("Output format: 'markdown' strips HTML tags (default), 'text' returns raw HTML"),
  }),
  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const url = String(args["url"] ?? "")
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return { output: "", error: "URL must start with http:// or https://" }
    }

    const format = (args["format"] as string | undefined) ?? "markdown"
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    // Caller'ın AbortSignal'ını da dinle
    ctx.signal?.addEventListener("abort", () => controller.abort())

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Aurict/0.0.1" },
        signal:  controller.signal,
      })
      if (!res.ok) return { output: "", error: `HTTP ${res.status} ${res.statusText}` }

      const raw  = await res.text()
      const body = format === "markdown" ? stripHtml(raw) : raw
      return { output: body.slice(0, MAX_CHARS) + (body.length > MAX_CHARS ? "\n\n[truncated]" : "") }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { output: "", error: `Fetch failed: ${msg}` }
    } finally {
      clearTimeout(timer)
    }
  },
}
