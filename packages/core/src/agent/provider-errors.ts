import { NonRetryableStreamError } from "../provider/fallback.js"
import { throwIfProviderRetryAborted, waitForProviderRetry } from "../provider/retry-delay.js"

export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, signal?: AbortSignal): Promise<T> {
  let attempt = 0
  while (true) {
    throwIfProviderRetryAborted(signal)
    try {
      return await fn()
    } catch (error) {
      if (error instanceof NonRetryableStreamError) throw error
      const message = error instanceof Error ? error.message : String(error)
      if (!/429|rate.?limit|too.many/i.test(message) || attempt >= maxRetries) throw error
      attempt++
      await waitForProviderRetry(parseRetryAfter(message) ?? 15_000, signal)
    }
  }
}

function parseRetryAfter(message: string): number | undefined {
  const match = message.match(/retry.{0,10}after[:\s]+(\d+)/i)
  return match ? Number(match[1]) * 1_000 : undefined
}

export function parseProviderError(error: unknown): string {
  const raw = sanitizeProviderDiagnostic(error instanceof Error ? error.message : String(error))
  const api = error as { statusCode?: number; url?: string; responseBody?: unknown }
  const status = typeof api?.statusCode === "number" ? api.statusCode : undefined
  const body = sanitizeProviderDiagnostic(
    typeof api?.responseBody === "string"
      ? api.responseBody
      : api?.responseBody !== undefined ? JSON.stringify(api.responseBody) : "",
  ).slice(0, 600)
  const detail = [
    status !== undefined ? `HTTP ${status}` : null,
    api?.url ? `endpoint: ${sanitizeProviderDiagnostic(api.url)}` : null,
    body ? `response: ${body}` : null,
  ].filter(Boolean).join("\n")

  if (status === 400 || /\b400\b|bad request/i.test(raw)) {
    return [
      "Provider rejected the request (400 Bad Request).",
      detail,
      "Common causes: unavailable model id, unsupported parameter, or a rejected tool schema.",
    ].filter(Boolean).join("\n")
  }
  if (status === 404 || /\b404\b|not found/i.test(raw)) return ["Model or endpoint not found (404).", detail, "Pick a current model from /models."].filter(Boolean).join("\n")
  if (status === 401 || /\b401\b|unauthorized|invalid.{0,20}key/i.test(raw)) return ["Invalid API key — update it with /config set <provider> <key>.", detail].filter(Boolean).join("\n")
  if (status === 403 || /\b403\b|forbidden/i.test(raw)) return ["Access forbidden (403) — the key may lack access to this model.", detail].filter(Boolean).join("\n")
  if (status === 429 || /\b429\b|rate.?limit|too.many/i.test(raw)) return "Rate limited — wait or switch provider (/providers)."
  if (/503|502|overload|unavailable/i.test(raw)) return "Provider temporarily unavailable — retry or switch provider."
  if (/ECONNREFUSED|ENOTFOUND|network|timeout/i.test(raw)) return "Network error — check your connection."
  return [raw, detail].filter(Boolean).join("\n")
}

export function sanitizeProviderDiagnostic(value: string): string {
  return value
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replace(/\b(?:sk|key|token)-[A-Za-z0-9_-]{8,}\b/gi, "[REDACTED]")
    .replace(
      /("(?:api[_-]?key|authorization|access[_-]?token|refresh[_-]?token|password)"\s*:\s*)"[^"]*"/gi,
      '$1"[REDACTED]"',
    )
    .replace(
      /\b((?:api[_-]?key|authorization|access[_-]?token|refresh[_-]?token|password)\s*[=:]\s*)[^\s,;]+/gi,
      "$1[REDACTED]",
    )
}
