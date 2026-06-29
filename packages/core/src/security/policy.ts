import type { OmniConfig, ResolvedSecuritySandboxConfig, SecuritySandboxProfile } from "../config/config.js"
import { resolveSecuritySandboxConfig } from "../config/config.js"
import { auditLogger } from "./audit.js"
import { ConcurrencyLimiter, TokenBucketLimiter } from "./rate-limiter.js"
import type { SecurityTarget } from "./runner.js"
import { appendFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"

export type SecurityAction =
  | "recon"
  | "web_baseline"
  | "nmap_top"
  | "nmap_service"
  | "testssl"
  | "nikto"
  | "nuclei"
  | "ffuf"
  | "gobuster"
  | "sqlmap"

export type SecurityRisk = "low" | "medium" | "high"
export type SecurityActionClass =
  | "passive-probe"
  | "active-enumeration"
  | "active-content-discovery"
  | "active-injection-check"
  | "tls-analysis"

export interface SecurityActionPolicy {
  risk: SecurityRisk
  actionClass: SecurityActionClass
  profiles: SecuritySandboxProfile[]
  approvalTags: string[]
  docker: boolean
  timeoutMs: number
  requestBudgetPerMinute: number
  requiresUrlTarget?: boolean | undefined
}

export const SECURITY_ACTION_POLICIES: Record<SecurityAction, SecurityActionPolicy> = {
  recon: {
    risk: "low",
    actionClass: "passive-probe",
    profiles: ["active-lite", "kali-full"],
    approvalTags: ["external-target"],
    docker: false,
    timeoutMs: 60_000,
    requestBudgetPerMinute: 30,
  },
  web_baseline: {
    risk: "low",
    actionClass: "passive-probe",
    profiles: ["active-lite", "kali-full"],
    approvalTags: ["external-target"],
    docker: false,
    timeoutMs: 30_000,
    requestBudgetPerMinute: 60,
  },
  nmap_top: {
    risk: "high",
    actionClass: "active-enumeration",
    profiles: ["active-lite", "kali-full"],
    approvalTags: ["network-scan", "external-target"],
    docker: true,
    timeoutMs: 90_000,
    requestBudgetPerMinute: 10,
  },
  nmap_service: {
    risk: "high",
    actionClass: "active-enumeration",
    profiles: ["active-lite", "kali-full"],
    approvalTags: ["network-scan", "external-target"],
    docker: true,
    timeoutMs: 120_000,
    requestBudgetPerMinute: 6,
  },
  testssl: {
    risk: "medium",
    actionClass: "tls-analysis",
    profiles: ["active-lite", "kali-full"],
    approvalTags: ["external-target"],
    docker: true,
    timeoutMs: 180_000,
    requestBudgetPerMinute: 10,
  },
  nikto: {
    risk: "high",
    actionClass: "active-content-discovery",
    profiles: ["active-lite", "kali-full"],
    approvalTags: ["network-scan", "external-target"],
    docker: true,
    timeoutMs: 180_000,
    requestBudgetPerMinute: 8,
  },
  nuclei: {
    risk: "high",
    actionClass: "active-content-discovery",
    profiles: ["active-lite", "kali-full"],
    approvalTags: ["network-scan", "external-target"],
    docker: true,
    timeoutMs: 180_000,
    requestBudgetPerMinute: 8,
  },
  ffuf: {
    risk: "high",
    actionClass: "active-content-discovery",
    profiles: ["active-lite", "kali-full"],
    approvalTags: ["network-scan", "external-target"],
    docker: true,
    timeoutMs: 120_000,
    requestBudgetPerMinute: 6,
  },
  gobuster: {
    risk: "high",
    actionClass: "active-content-discovery",
    profiles: ["active-lite", "kali-full"],
    approvalTags: ["network-scan", "external-target"],
    docker: true,
    timeoutMs: 120_000,
    requestBudgetPerMinute: 6,
  },
  sqlmap: {
    risk: "high",
    actionClass: "active-injection-check",
    profiles: ["active-lite", "kali-full"],
    approvalTags: ["network-scan", "external-target", "injection-check"],
    docker: true,
    timeoutMs: 180_000,
    requestBudgetPerMinute: 3,
    requiresUrlTarget: true,
  },
}

export interface SecurityAuditTrailEvent {
  timestamp: number
  phase: "start" | "complete" | "error" | "rate_limit" | "approval_required"
  action: SecurityAction
  target: string
  host: string
  profile: SecuritySandboxProfile
  risk: SecurityRisk
  actionClass: SecurityActionClass
  details?: Record<string, unknown> | undefined
}

export function getSecurityActionPolicy(action: SecurityAction): SecurityActionPolicy {
  return SECURITY_ACTION_POLICIES[action]
}

export function getSecurityActionTimeoutMs(action: SecurityAction): number {
  return SECURITY_ACTION_POLICIES[action].timeoutMs
}

export function getSecurityActionRequestBudget(action: SecurityAction, security: ResolvedSecuritySandboxConfig): number {
  const policy = SECURITY_ACTION_POLICIES[action]
  if (security.requestsPerMinute <= 0) return policy.requestBudgetPerMinute
  return Math.min(security.requestsPerMinute, policy.requestBudgetPerMinute)
}

class SecurityPolicyManager {
  private concurrencyLimiters = new Map<string, ConcurrencyLimiter>()
  private rateLimiters = new Map<string, TokenBucketLimiter>()

  async run<T>(opts: {
    action: SecurityAction
    target: SecurityTarget
    config: OmniConfig
    workdir: string
    fn: () => Promise<T>
  }): Promise<T> {
    const security = this.assertActionAllowed(opts.action, opts.target, opts.config)
    const policy = SECURITY_ACTION_POLICIES[opts.action]
    const limiter = this.getConcurrencyLimiter(security)
    return limiter.run(async () => {
      this.assertRateLimit(opts.action, security, opts.target)
      const startedAt = Date.now()
      appendSecurityAuditTrail(opts.workdir, {
        timestamp: startedAt,
        phase: "start",
        action: opts.action,
        target: opts.target.raw,
        host: opts.target.host,
        profile: security.profile,
        risk: policy.risk,
        actionClass: policy.actionClass,
        details: {
          network: security.network,
          requestBudgetPerMinute: getSecurityActionRequestBudget(opts.action, security),
          timeoutMs: policy.timeoutMs,
        },
      })
      auditLogger.log({
        type: "tool_call",
        severity: policy.risk === "high" ? "warning" : "info",
        actor: "security_policy",
        action: `security:${opts.action}`,
        resource: opts.target.raw,
        details: {
          profile: security.profile,
          target: opts.target.host,
          network: security.network,
          risk: policy.risk,
          actionClass: policy.actionClass,
          timeoutMs: policy.timeoutMs,
          workdir: opts.workdir,
        },
      })
      try {
        const result = await opts.fn()
        appendSecurityAuditTrail(opts.workdir, {
          timestamp: Date.now(),
          phase: "complete",
          action: opts.action,
          target: opts.target.raw,
          host: opts.target.host,
          profile: security.profile,
          risk: policy.risk,
          actionClass: policy.actionClass,
          details: { durationMs: Date.now() - startedAt },
        })
        auditLogger.log({
          type: "security_alert",
          severity: "info",
          actor: "security_policy",
          action: `security:${opts.action}:complete`,
          resource: opts.target.raw,
          details: { profile: security.profile, durationMs: Date.now() - startedAt },
        })
        return result
      } catch (err) {
        appendSecurityAuditTrail(opts.workdir, {
          timestamp: Date.now(),
          phase: "error",
          action: opts.action,
          target: opts.target.raw,
          host: opts.target.host,
          profile: security.profile,
          risk: policy.risk,
          actionClass: policy.actionClass,
          details: { error: err instanceof Error ? err.message : String(err) },
        })
        auditLogger.logError("security_policy", err instanceof Error ? err.message : String(err), {
          action: opts.action,
          target: opts.target.raw,
          profile: security.profile,
        })
        throw err
      }
    })
  }

  assertActionAllowed(action: SecurityAction, target: SecurityTarget, config: OmniConfig): ResolvedSecuritySandboxConfig {
    const security = resolveSecuritySandboxConfig(config)
    if (!security.enabled || security.profile === "off" || security.profile === "passive") {
      throw new Error("security sandbox active profile is required. Set securitySandbox.enabled=true and profile='active-lite' or 'kali-full'.")
    }

    const policy = SECURITY_ACTION_POLICIES[action]
    if (!policy.profiles.includes(security.profile)) {
      throw new Error(`security action '${action}' is not available for profile '${security.profile}'.`)
    }

    if (security.network === "host" && !security.requireApprovalFor.includes("host-network")) {
      throw new Error("securitySandbox.network='host' requires requireApprovalFor to include 'host-network'.")
    }

    if (policy.requiresUrlTarget && !target.url) {
      throw new Error(`security action '${action}' requires an explicit http(s) URL target, not a bare host.`)
    }

    if (policy.actionClass === "active-injection-check" && security.network === "host") {
      throw new Error(`security action '${action}' cannot run with securitySandbox.network='host'. Use restricted network mode.`)
    }

    if (policy.approvalTags.some(tag => security.requireApprovalFor.includes(tag))) {
      // Permission prompting is handled by the tool permission layer; this records the policy contract.
      auditLogger.logSecurityAlert("security_policy", `security action requires approval: ${action}`, "warning", {
        target: target.raw,
        approvalTags: policy.approvalTags,
        actionClass: policy.actionClass,
      })
    }

    return security
  }

  resetForTests(): void {
    this.concurrencyLimiters.clear()
    this.rateLimiters.clear()
  }

  private assertRateLimit(action: SecurityAction, security: ResolvedSecuritySandboxConfig, target: SecurityTarget): void {
    const budget = getSecurityActionRequestBudget(action, security)
    if (budget <= 0) return
    const key = `${security.profile}:${action}:${budget}:${target.host}`
    let limiter = this.rateLimiters.get(key)
    if (!limiter) {
      limiter = new TokenBucketLimiter({ maxRequests: budget, windowMs: 60_000 })
      this.rateLimiters.set(key, limiter)
    }
    const result = limiter.check(key)
    if (!result.allowed) {
      auditLogger.logRateLimit("security_policy", target.host, result.retryAfterMs)
      throw new Error(`security rate limit exceeded for '${target.host}'. Retry after ${result.retryAfterMs ?? 0}ms.`)
    }
  }

  private getConcurrencyLimiter(security: ResolvedSecuritySandboxConfig): ConcurrencyLimiter {
    const maxConcurrent = Math.max(1, security.maxConcurrent)
    const key = `${security.profile}:${maxConcurrent}`
    let limiter = this.concurrencyLimiters.get(key)
    if (!limiter) {
      limiter = new ConcurrencyLimiter(maxConcurrent)
      this.concurrencyLimiters.set(key, limiter)
    }
    return limiter
  }
}

export const securityPolicyManager = new SecurityPolicyManager()

export function appendSecurityAuditTrail(workdir: string, event: SecurityAuditTrailEvent): void {
  try {
    const dir = join(workdir, ".aurict", "security", "audit")
    mkdirSync(dir, { recursive: true })
    appendFileSync(join(dir, `${safeAuditName(event.host)}.jsonl`), JSON.stringify(event) + "\n", "utf8")
  } catch {
    // Audit trail failures must not block security tool execution.
  }
}

function safeAuditName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_.-]+/g, "_").slice(0, 80) || "target"
}
