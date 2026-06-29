import type { OmniConfig, ResolvedSecuritySandboxConfig, SecuritySandboxProfile } from "../config/config.js"
import { resolveSecuritySandboxConfig } from "../config/config.js"
import { auditLogger } from "./audit.js"
import { ConcurrencyLimiter, TokenBucketLimiter } from "./rate-limiter.js"
import type { SecurityTarget } from "./runner.js"

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

export interface SecurityActionPolicy {
  risk: SecurityRisk
  profiles: SecuritySandboxProfile[]
  approvalTags: string[]
  docker: boolean
}

export const SECURITY_ACTION_POLICIES: Record<SecurityAction, SecurityActionPolicy> = {
  recon: {
    risk: "low",
    profiles: ["active-lite", "kali-full"],
    approvalTags: ["external-target"],
    docker: false,
  },
  web_baseline: {
    risk: "low",
    profiles: ["active-lite", "kali-full"],
    approvalTags: ["external-target"],
    docker: false,
  },
  nmap_top: {
    risk: "high",
    profiles: ["active-lite", "kali-full"],
    approvalTags: ["network-scan", "external-target"],
    docker: true,
  },
  nmap_service: {
    risk: "high",
    profiles: ["active-lite", "kali-full"],
    approvalTags: ["network-scan", "external-target"],
    docker: true,
  },
  testssl: {
    risk: "medium",
    profiles: ["active-lite", "kali-full"],
    approvalTags: ["external-target"],
    docker: true,
  },
  nikto: {
    risk: "high",
    profiles: ["active-lite", "kali-full"],
    approvalTags: ["network-scan", "external-target"],
    docker: true,
  },
  nuclei: {
    risk: "high",
    profiles: ["active-lite", "kali-full"],
    approvalTags: ["network-scan", "external-target"],
    docker: true,
  },
  ffuf: {
    risk: "high",
    profiles: ["active-lite", "kali-full"],
    approvalTags: ["network-scan", "external-target"],
    docker: true,
  },
  gobuster: {
    risk: "high",
    profiles: ["active-lite", "kali-full"],
    approvalTags: ["network-scan", "external-target"],
    docker: true,
  },
  sqlmap: {
    risk: "high",
    profiles: ["active-lite", "kali-full"],
    approvalTags: ["network-scan", "external-target"],
    docker: true,
  },
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
    const limiter = this.getConcurrencyLimiter(security)
    return limiter.run(async () => {
      this.assertRateLimit(security, opts.target)
      const startedAt = Date.now()
      auditLogger.log({
        type: "tool_call",
        severity: SECURITY_ACTION_POLICIES[opts.action].risk === "high" ? "warning" : "info",
        actor: "security_policy",
        action: `security:${opts.action}`,
        resource: opts.target.raw,
        details: {
          profile: security.profile,
          target: opts.target.host,
          network: security.network,
          workdir: opts.workdir,
        },
      })
      try {
        const result = await opts.fn()
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

    if (policy.approvalTags.some(tag => security.requireApprovalFor.includes(tag))) {
      // Permission prompting is handled by the tool permission layer; this records the policy contract.
      auditLogger.logSecurityAlert("security_policy", `security action requires approval: ${action}`, "warning", {
        target: target.raw,
        approvalTags: policy.approvalTags,
      })
    }

    return security
  }

  resetForTests(): void {
    this.concurrencyLimiters.clear()
    this.rateLimiters.clear()
  }

  private assertRateLimit(security: ResolvedSecuritySandboxConfig, target: SecurityTarget): void {
    if (security.requestsPerMinute <= 0) return
    const key = `${security.profile}:${security.requestsPerMinute}:${target.host}`
    let limiter = this.rateLimiters.get(key)
    if (!limiter) {
      limiter = new TokenBucketLimiter({ maxRequests: security.requestsPerMinute, windowMs: 60_000 })
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
