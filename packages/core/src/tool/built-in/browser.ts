import { z } from "zod"
import { executeBrowserAction, isLocalBrowserUrl } from "../browser/session.js"
import { hooks } from "../../hook/emitter.js"
import { closeBrowserSession } from "../browser/session.js"
import type { ToolDef } from "../types.js"

const actions = ["open", "navigate", "snapshot", "click", "fill", "press", "screenshot", "assert_text", "assert_visible", "assert_url", "close"] as const

export const browserTool: ToolDef = {
  id: "browser",
  timeoutMs: 60_000,
  description: `Drive a bounded Chromium session to verify web UI behavior.

Call open first, then use snapshot/click/fill/press/assert actions, and close when
finished. Prefer accessibility snapshots and deterministic assertions; use
screenshot when visual verification is required. External URLs require approval.`,
  parameters: z.object({
    action: z.enum(actions),
    url: z.string().optional(),
    html: z.string().optional(),
    selector: z.string().optional(),
    value: z.string().optional(),
    key: z.string().optional(),
    expected: z.string().optional(),
    viewport: z.object({ width: z.number().int().min(320).max(3840), height: z.number().int().min(240).max(2160) }).optional(),
  }),
  spec: {
    category: "network",
    riskLevel: "medium",
    requiresConfirmation: args => typeof args["url"] === "string" && !isLocalBrowserUrl(args["url"]),
    permissionSummary: "Open and interact with a web page in a bounded browser session",
  },
  async execute(args, ctx) {
    try {
      return await executeBrowserAction({
        action: args["action"] as typeof actions[number],
        ...(args["url"] ? { url: String(args["url"]) } : {}),
        ...(args["html"] ? { html: String(args["html"]) } : {}),
        ...(args["selector"] ? { selector: String(args["selector"]) } : {}),
        ...(args["value"] !== undefined ? { value: String(args["value"]) } : {}),
        ...(args["key"] ? { key: String(args["key"]) } : {}),
        ...(args["expected"] ? { expected: String(args["expected"]) } : {}),
        ...(args["viewport"] ? { viewport: args["viewport"] as { width: number; height: number } } : {}),
      }, ctx)
    } catch (error) {
      return { output: "", error: error instanceof Error ? error.message : String(error) }
    }
  },
}

hooks.on("v1.session.end", async payload => {
  const sessionId = (payload as Record<string, unknown>)["sessionId"]
  if (typeof sessionId === "string") await closeBrowserSession(sessionId)
  return payload
})
