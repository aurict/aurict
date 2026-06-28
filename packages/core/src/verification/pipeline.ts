import type { ExecuteResult } from "../tool/types.js"

export type VerificationCheck = "tsc"
export type VerificationStatus = "passed" | "failed" | "skipped" | "timeout"

export interface VerificationCheckResult {
  status: VerificationStatus
  reason?: string
  output?: string
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

export function verificationSummary(result: ExecuteResult): string {
  const tsc = result.metadata?.verification?.tsc
  if (!tsc) return "not_verified"
  if (tsc.status === "passed") return "verified:tsc"
  if (tsc.status === "failed") return "failed:tsc"
  if (tsc.status === "timeout") return "timeout:tsc"
  return `skipped:tsc${tsc.reason ? `:${tsc.reason}` : ""}`
}
