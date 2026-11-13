import { Hono } from "hono"
import { z } from "zod"
import { newId, now } from "../crypto/ids"
import { requireAuth } from "../middleware/auth"
import { rateLimit } from "../middleware/rate-limit"
import type { AppBindings } from "../types"
import type { FeedbackReport, FeedbackReportReason } from "../store/types"

const reportReasonSchema = z.enum([
  "incorrect",
  "unsafe",
  "hallucination",
  "formatting",
  "tool_issue",
  "other",
])

const toolSummarySchema = z.object({
  name: z.string().min(1).max(80),
  status: z.string().min(1).max(40).optional(),
  ok: z.boolean().optional(),
}).strict()

const createReportSchema = z.object({
  reason: reportReasonSchema,
  note: z.string().max(1_500).optional(),
  userMessage: z.string().max(4_000).optional(),
  assistantMessage: z.string().min(1).max(12_000),
  provider: z.string().max(80).optional(),
  model: z.string().max(160).optional(),
  appVersion: z.string().max(80).optional(),
  platform: z.literal("mobile").default("mobile"),
  toolSummary: z.array(toolSummarySchema).max(24).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
}).strict()

export const feedbackRoutes = new Hono<AppBindings>()
  .use("/feedback/*", requireAuth)
  // Reports can include up to 24 KB of conversation text, so cap how many one account can file.
  .post("/feedback/reports", rateLimit(10, 60 * 60_000, "feedback", { by: "user" }), async (c) => {
    const body = createReportSchema.parse(await c.req.json())
    const user = c.get("user")!
    const createdAt = now()
    const note = sanitizeText(body.note, 1_500)
    const userMessage = sanitizeText(body.userMessage, 4_000)
    const provider = sanitizeText(body.provider, 80)
    const model = sanitizeText(body.model, 160)
    const appVersion = sanitizeText(body.appVersion, 80)
    const report: FeedbackReport = {
      id: newId("fbr"),
      userId: user.id,
      reason: body.reason as FeedbackReportReason,
      assistantMessage: sanitizeText(body.assistantMessage, 12_000) ?? "",
      platform: "mobile" as const,
      toolSummaryJson: JSON.stringify(body.toolSummary),
      metadataJson: JSON.stringify(sanitizeMetadata(body.metadata)),
      createdAt,
      ...(note ? { note } : {}),
      ...(userMessage ? { userMessage } : {}),
      ...(provider ? { provider } : {}),
      ...(model ? { model } : {}),
      ...(appVersion ? { appVersion } : {}),
    }
    await c.get("repo").createFeedbackReport(report)
    await c.get("repo").addAuditLog({
      id: newId("aud"),
      userId: user.id,
      event: "feedback.report_created",
      metadataJson: JSON.stringify({
        reportId: report.id,
        reason: report.reason,
        provider: report.provider,
        model: report.model,
      }),
      createdAt,
    })
    return c.json({ ok: true, report: { id: report.id, createdAt: report.createdAt.toISOString() } }, 201)
  })

function sanitizeText(value: string | undefined, max: number) {
  const normalized = value?.trim()
  if (!normalized) return undefined
  return redactSecrets(normalized).slice(0, max)
}

function sanitizeMetadata(metadata: Record<string, unknown>) {
  const allowed: Record<string, unknown> = {}
  for (const key of ["messageStatus", "toolCount", "artifactCount", "locale", "client"] as const) {
    const value = metadata[key]
    if (typeof value === "string") allowed[key] = redactSecrets(value).slice(0, 200)
    if (typeof value === "number" || typeof value === "boolean") allowed[key] = value
  }
  return allowed
}

function redactSecrets(value: string) {
  return value
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, "[redacted-secret]")
    .replace(/\b(?:api[_ -]?key|token|secret)\s*[:=]\s*["']?[^"'\s]{8,}/gi, "[redacted-secret]")
}
