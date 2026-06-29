import { resolve4, resolve6, resolveCname, resolveMx, resolveNs, resolveTxt } from "node:dns/promises"
import { connect as tlsConnect } from "node:tls"
import { domainToASCII } from "node:url"
import { resolveSecuritySandboxConfig, type OmniConfig, type ResolvedSecuritySandboxConfig, type SecuritySandboxConfig } from "../config/config.js"
import { isActiveSecurityEnabled, normalizeSecuritySandboxConfig } from "./capability.js"
import { securityPolicyManager } from "./policy.js"

export type SecurityCheckStatus = "pass" | "warning" | "fail" | "info"
export type SecuritySeverity = "info" | "low" | "medium" | "high"

export interface SecurityTarget {
  raw: string
  url?: URL
  host: string
  port?: number
  protocol?: string
}

export interface SecurityFinding {
  id: string
  title: string
  status: SecurityCheckStatus
  severity: SecuritySeverity
  detail: string
  evidence?: string
  recommendation?: string
}

export interface SecurityRunResult {
  target: SecurityTarget
  profile: string
  checks: SecurityFinding[]
  artifacts?: Record<string, unknown>
}

export function parseSecurityTarget(input: string): SecurityTarget {
  const raw = input.trim()
  if (!raw) throw new Error("target is required")

  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw)
  if (hasScheme) {
    const url = new URL(raw)
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("target URL must use http:// or https://")
    }
    return {
      raw,
      url,
      host: normalizeTargetHost(url.hostname),
      port: url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80,
      protocol: url.protocol.replace(":", ""),
    }
  }

  const withoutPath = raw.split("/")[0] ?? raw
  const [hostPart, portPart] = withoutPath.includes(":") && !withoutPath.includes("]")
    ? withoutPath.split(":")
    : [withoutPath, undefined]
  const host = normalizeTargetHost(String(hostPart ?? ""))
  if (portPart !== undefined && (!/^\d+$/.test(portPart) || Number(portPart) < 1 || Number(portPart) > 65535)) {
    throw new Error("target port must be between 1 and 65535")
  }
  return {
    raw,
    host,
    ...(portPart ? { port: Number(portPart) } : {}),
  }
}

export function assertSecurityCapabilityEnabled(config: OmniConfig | SecuritySandboxConfig): ResolvedSecuritySandboxConfig {
  const security = normalizeSecuritySandboxConfig(config)
  if (!isActiveSecurityEnabled(security)) {
    throw new Error("security sandbox active profile is required. Set securitySandbox.enabled=true and profile='active-lite' or 'kali-full'.")
  }
  return security
}

export function assertTargetAllowed(target: SecurityTarget, config: OmniConfig | SecuritySandboxConfig): void {
  const security = assertSecurityCapabilityEnabled(config)
  const allowlist = security.targetAllowlist ?? []
  if (allowlist.length === 0) {
    throw new Error(`target '${target.host}' is not allowed. Add it to securitySandbox.targetAllowlist before running security tools.`)
  }

  const allowed = allowlist.some((pattern) => targetMatchesAllowlist(pattern, target))
  if (!allowed) {
    throw new Error(`target '${target.host}' is not allowed by securitySandbox.targetAllowlist.`)
  }
}

export async function runSecurityRecon(targetInput: string, config: OmniConfig): Promise<SecurityRunResult> {
  const target = parseSecurityTarget(targetInput)
  assertTargetAllowed(target, config)
  return securityPolicyManager.run({
    action: "recon",
    target,
    config,
    workdir: process.cwd(),
    fn: async () => {
      const profile = resolveSecuritySandboxConfig(config).profile
      const checks: SecurityFinding[] = []
      const artifacts: Record<string, unknown> = {}

      const dns = await collectDns(target.host)
      artifacts["dns"] = dns
      checks.push({
        id: "dns-resolution",
        title: "DNS resolution",
        status: dns.errors.length > 0 && dns.a.length === 0 && dns.aaaa.length === 0 ? "warning" : "info",
        severity: "info",
        detail: formatDnsSummary(dns),
      })

      const url = target.url ?? new URL(`https://${target.host}`)
      const headers = await fetchHeaders(url).catch((err) => ({ error: err instanceof Error ? err.message : String(err) }))
      artifacts["http"] = headers
      checks.push({
        id: "http-reachability",
        title: "HTTP reachability",
        status: "error" in headers ? "warning" : "info",
        severity: "info",
        detail: "error" in headers ? headers.error : `HTTP ${headers.status} ${headers.statusText}`,
        ...("error" in headers ? {} : { evidence: JSON.stringify(headers.headers, null, 2).slice(0, 1_500) }),
      })

      if ((target.url?.protocol ?? "https:") === "https:") {
        const tls = await inspectTls(target.host, target.port ?? 443).catch((err) => ({ error: err instanceof Error ? err.message : String(err) }))
        artifacts["tls"] = tls
        checks.push({
          id: "tls-certificate",
          title: "TLS certificate",
          status: "error" in tls ? "warning" : "info",
          severity: "info",
          detail: "error" in tls ? tls.error : `Valid until ${tls.validTo}; issuer=${tls.issuer}`,
        })
      }

      return { target, profile, checks, artifacts }
    },
  })
}

export async function runWebBaselineScan(targetInput: string, config: OmniConfig): Promise<SecurityRunResult> {
  const target = parseSecurityTarget(targetInput)
  assertTargetAllowed(target, config)
  return securityPolicyManager.run({
    action: "web_baseline",
    target,
    config,
    workdir: process.cwd(),
    fn: async () => {
      const profile = resolveSecuritySandboxConfig(config).profile
      const url = target.url ?? new URL(`https://${target.host}`)
      const headersResult = await fetchHeaders(url)
      const headers = normalizeHeaders(headersResult.headers)
      const checks: SecurityFinding[] = []

      checks.push(...securityHeaderFindings(headers, url.protocol === "https:"))
      checks.push({
        id: "server-header",
        title: "Server header exposure",
        status: headers["server"] ? "warning" : "pass",
        severity: headers["server"] ? "low" : "info",
        detail: headers["server"] ? "Server header is exposed." : "Server header is not exposed.",
        ...(headers["server"] ? { evidence: `server: ${headers["server"]}` } : {}),
        recommendation: "Avoid exposing exact server/runtime versions in public responses.",
      })

      return {
        target,
        profile,
        checks,
        artifacts: {
          http: headersResult,
          summary: summarizeFindings(checks),
        },
      }
    },
  })
}

export function buildSecurityReport(title: string, results: SecurityRunResult[]): string {
  const lines: string[] = [
    `# ${title}`,
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
  ]

  for (const result of results) {
    const summary = summarizeFindings(result.checks)
    lines.push(`## Target: ${result.target.raw}`)
    lines.push("")
    lines.push(`Profile: ${result.profile}`)
    lines.push(`Summary: ${summary.fail} fail, ${summary.warning} warning, ${summary.pass} pass, ${summary.info} info`)
    lines.push("")
    for (const finding of result.checks) {
      lines.push(`### [${finding.status.toUpperCase()}] ${finding.title}`)
      lines.push("")
      lines.push(`Severity: ${finding.severity}`)
      lines.push("")
      lines.push(finding.detail)
      if (finding.evidence) lines.push("", "Evidence:", "```", finding.evidence.slice(0, 2_000), "```")
      if (finding.recommendation) lines.push("", `Recommendation: ${finding.recommendation}`)
      lines.push("")
    }
  }

  return lines.join("\n").trim() + "\n"
}

export function summarizeFindings(checks: SecurityFinding[]): Record<SecurityCheckStatus, number> {
  return {
    pass: checks.filter((check) => check.status === "pass").length,
    warning: checks.filter((check) => check.status === "warning").length,
    fail: checks.filter((check) => check.status === "fail").length,
    info: checks.filter((check) => check.status === "info").length,
  }
}

export function targetMatchesAllowlist(patternInput: string, target: SecurityTarget): boolean {
  const pattern = normalizeAllowlistPattern(patternInput)
  const host = target.host

  if (pattern === host || pattern === target.raw.toLowerCase()) return true
  if (pattern.startsWith("*.")) {
    const { host: patternHost, port } = splitPatternHostPort(pattern)
    if (port !== undefined && target.port !== port) return false
    const suffix = patternHost.slice(1)
    return host.endsWith(suffix) && host !== suffix.slice(1)
  }
  if (pattern.includes("://")) {
    try {
      const url = new URL(pattern)
      const patternHost = normalizeTargetHost(url.hostname)
      const port = url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80
      if (url.protocol.replace(":", "") !== target.protocol && target.protocol !== undefined) return false
      if (target.port !== undefined && port !== target.port) return false
      return patternHost === host
    } catch {
      return false
    }
  }
  const { host: patternHost, port } = splitPatternHostPort(pattern)
  if (port !== undefined && target.port !== port) return false
  if (patternHost === host) return true
  return false
}

function normalizeAllowlistPattern(pattern: string): string {
  return pattern.trim().toLowerCase().replace(/\/+$/, "")
}

function splitPatternHostPort(pattern: string): { host: string; port?: number } {
  const [rawHost, rawPort] = pattern.includes(":") && !pattern.includes("]") ? pattern.split(":") : [pattern, undefined]
  const host = rawHost?.startsWith("*.") ? `*.${normalizeTargetHost(rawHost.slice(2))}` : normalizeTargetHost(rawHost ?? "")
  const port = rawPort !== undefined && /^\d+$/.test(rawPort) ? Number(rawPort) : undefined
  return port !== undefined ? { host, port } : { host }
}

function normalizeTargetHost(input: string): string {
  const trimmed = input.trim().toLowerCase().replace(/\.$/, "")
  const ascii = domainToASCII(trimmed) || trimmed
  if (!ascii || /[\s'"`$<>\\/]/.test(ascii)) throw new Error("target host contains invalid characters")
  return ascii
}

async function collectDns(host: string): Promise<{
  a: string[]
  aaaa: string[]
  cname: string[]
  mx: string[]
  ns: string[]
  txt: string[]
  errors: string[]
}> {
  const errors: string[] = []
  const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try { return await fn() } catch (err) { errors.push(err instanceof Error ? err.message : String(err)); return fallback }
  }
  const [a, aaaa, cname, mx, ns, txt] = await Promise.all([
    safe(() => resolve4(host), [] as string[]),
    safe(() => resolve6(host), [] as string[]),
    safe(() => resolveCname(host), [] as string[]),
    safe(() => resolveMx(host), [] as Array<{ exchange: string; priority: number }>),
    safe(() => resolveNs(host), [] as string[]),
    safe(() => resolveTxt(host), [] as string[][]),
  ])
  return {
    a,
    aaaa,
    cname,
    mx: mx.map((entry) => `${entry.priority} ${entry.exchange}`),
    ns,
    txt: txt.map((entry) => entry.join(" ")).slice(0, 20),
    errors: [...new Set(errors)].slice(0, 6),
  }
}

function formatDnsSummary(dns: Awaited<ReturnType<typeof collectDns>>): string {
  const parts = [
    `${dns.a.length} A`,
    `${dns.aaaa.length} AAAA`,
    `${dns.cname.length} CNAME`,
    `${dns.mx.length} MX`,
    `${dns.ns.length} NS`,
    `${dns.txt.length} TXT`,
  ]
  return `${parts.join(", ")} record(s).`
}

async function fetchHeaders(url: URL): Promise<{ status: number; statusText: string; headers: Record<string, string>; finalUrl: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15_000)
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": "Aurict-Security/0.1" },
      signal: controller.signal,
    })
    const headers: Record<string, string> = {}
    res.headers.forEach((value, key) => { headers[key] = value })
    return { status: res.status, statusText: res.statusText, headers, finalUrl: res.url }
  } finally {
    clearTimeout(timer)
  }
}

function inspectTls(host: string, port: number): Promise<{ subject: string; issuer: string; validFrom: string; validTo: string; fingerprint256?: string }> {
  return new Promise((resolve, reject) => {
    const socket = tlsConnect({ host, port, servername: host, rejectUnauthorized: false, timeout: 10_000 }, () => {
      const cert = socket.getPeerCertificate()
      socket.end()
      if (!cert || Object.keys(cert).length === 0) {
        reject(new Error("no peer certificate returned"))
        return
      }
      resolve({
        subject: cert.subject ? JSON.stringify(cert.subject) : "",
        issuer: cert.issuer ? JSON.stringify(cert.issuer) : "",
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        ...(cert.fingerprint256 ? { fingerprint256: cert.fingerprint256 } : {}),
      })
    })
    socket.on("timeout", () => {
      socket.destroy()
      reject(new Error("TLS connection timed out"))
    })
    socket.on("error", reject)
  })
}

function normalizeHeaders(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]))
}

function securityHeaderFindings(headers: Record<string, string>, https: boolean): SecurityFinding[] {
  const required: Array<{ key: string; title: string; severity: SecuritySeverity; recommendation: string }> = [
    { key: "content-security-policy", title: "Content-Security-Policy", severity: "medium", recommendation: "Set a restrictive Content-Security-Policy appropriate for the application." },
    { key: "x-frame-options", title: "X-Frame-Options", severity: "low", recommendation: "Set X-Frame-Options or frame-ancestors in CSP to reduce clickjacking risk." },
    { key: "x-content-type-options", title: "X-Content-Type-Options", severity: "low", recommendation: "Set X-Content-Type-Options: nosniff." },
    { key: "referrer-policy", title: "Referrer-Policy", severity: "low", recommendation: "Set a privacy-preserving Referrer-Policy." },
    { key: "permissions-policy", title: "Permissions-Policy", severity: "low", recommendation: "Set Permissions-Policy to disable unused browser features." },
  ]

  const findings = required.map((header): SecurityFinding => ({
    id: `header-${header.key}`,
    title: header.title,
    status: headers[header.key] ? "pass" : "warning",
    severity: headers[header.key] ? "info" : header.severity,
    detail: headers[header.key] ? `${header.key} is present.` : `${header.key} is missing.`,
    ...(headers[header.key] ? { evidence: `${header.key}: ${headers[header.key]}` } : {}),
    recommendation: header.recommendation,
  }))

  findings.unshift({
    id: "header-strict-transport-security",
    title: "Strict-Transport-Security",
    status: !https || headers["strict-transport-security"] ? "pass" : "warning",
    severity: !https || headers["strict-transport-security"] ? "info" : "medium",
    detail: !https
      ? "Target is not HTTPS; HSTS is not applicable."
      : headers["strict-transport-security"]
        ? "HSTS is present."
        : "HSTS is missing on an HTTPS target.",
    ...(headers["strict-transport-security"] ? { evidence: `strict-transport-security: ${headers["strict-transport-security"]}` } : {}),
    recommendation: "For HTTPS applications, set Strict-Transport-Security after confirming all subdomains support HTTPS.",
  })

  return findings
}
