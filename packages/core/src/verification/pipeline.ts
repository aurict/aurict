import type { ExecuteResult } from "../tool/types.js"

// Faz 4.1: TS/JS dışı diller için de post-edit doğrulama — dile-agnostik.
export type VerificationCheck = "tsc" | "ruff" | "mypy" | "govet" | "cargo" | "ruby" | "rubocop" | "test" | "lint" | "security" | "deps"
export type VerificationStatus = "passed" | "failed" | "skipped" | "timeout"

export interface VerificationCheckResult {
  status: VerificationStatus
  reason?: string
  output?: string
  workspaceRevision?: string
  baseRevision?: string
}

export function withVerification(
  result: ExecuteResult,
  check: VerificationCheck,
  checkResult: VerificationCheckResult,
): ExecuteResult {
  return {
    ...result,
    metadata: {
      ...result.metadata,
      verification: {
        ...result.metadata?.verification,
        [check]: checkResult,
      },
    },
  }
}

export function withTscVerification(
  result: ExecuteResult,
  checkResult: VerificationCheckResult,
): ExecuteResult {
  return withVerification(result, "tsc", checkResult)
}

const ALL_CHECKS: VerificationCheck[] = ["tsc", "ruff", "mypy", "govet", "cargo", "ruby", "rubocop", "test", "lint", "security", "deps"]

/**
 * Bir tool sonucundaki TÜM doğrulama kontrollerini (tsc + dile-agnostik
 * runner'lar) özetler. Önceden sadece .tsc okunuyordu — Python/Go/Rust/Ruby
 * projelerinde hiçbir doğrulama sinyali completion-gate'e ulaşmıyordu.
 * Birden fazla check varsa en kötü durumu (failed > timeout > skipped > passed)
 * öne çıkarır; her check'in özetini "check:status" olarak birleştirir.
 */
export function verificationSummary(result: ExecuteResult): string {
  const verification = result.metadata?.verification
  if (!verification) return "not_verified"

  const entries = ALL_CHECKS
    .map((check) => ({ check, result: verification[check] }))
    .filter((entry): entry is { check: VerificationCheck; result: VerificationCheckResult } => !!entry.result)

  if (entries.length === 0) return "not_verified"

  const parts = entries.map(({ check, result: r }) => {
    if (r.status === "passed")  return `verified:${check}`
    if (r.status === "failed")  return `failed:${check}`
    if (r.status === "timeout") return `timeout:${check}`
    return `skipped:${check}${r.reason ? `:${r.reason}` : ""}`
  })

  return parts.join(", ")
}
