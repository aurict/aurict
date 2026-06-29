import { mkdir } from "node:fs/promises"
import { join } from "node:path"
import { spawn } from "bun"
import type { OmniConfig, SecuritySandboxConfig } from "../config/config.js"
import { resolveSecuritySandboxConfig } from "../config/config.js"
import { assertTargetAllowed, parseSecurityTarget, type SecurityTarget } from "./runner.js"
import { getSecurityActionRequestBudget, getSecurityActionTimeoutMs, securityPolicyManager } from "./policy.js"

export type SecurityDockerAction =
  | "nmap_top"
  | "nmap_service"
  | "testssl"
  | "nikto"
  | "nuclei"
  | "ffuf"
  | "gobuster"
  | "sqlmap"

export interface SecurityDockerRunRequest {
  action: SecurityDockerAction
  target: string
  workdir: string
  config: OmniConfig
  signal: AbortSignal
  wordlist?: string | undefined
  extra?: Record<string, string | number | boolean | undefined> | undefined
}

export interface SecurityDockerRunResult {
  action: SecurityDockerAction
  target: SecurityTarget
  image: string
  command: string[]
  outputDir: string
  stdout: string
  stderr: string
  exitCode: number
  timedOut: boolean
}

const OUTPUT_MAX_CHARS = 60_000
export function buildSecurityDockerCommand(action: SecurityDockerAction, target: SecurityTarget, req: Pick<SecurityDockerRunRequest, "wordlist" | "extra"> = {}): string[] {
  const host = target.host
  const url = target.url?.toString() ?? `https://${host}`
  const safeHost = safeName(host)
  const rateLimit = String(req.extra?.["rateLimit"] ?? 20)
  switch (action) {
    case "nmap_top":
      return ["nmap", "-sV", "-T3", "--top-ports", "100", "-oA", "/outputs/nmap-top-" + safeHost, host]
    case "nmap_service":
      return ["nmap", "-sV", "-sC", "-T3", "-oA", "/outputs/nmap-service-" + safeHost, host]
    case "testssl":
      return ["testssl.sh", "--warnings", "batch", "--color", "0", "--jsonfile", "/outputs/testssl-" + safeHost + ".json", url]
    case "nikto":
      return ["nikto", "-nointeractive", "-Tuning", "b", "-host", url, "-output", "/outputs/nikto-" + safeHost + ".txt"]
    case "nuclei":
      return ["nuclei", "-u", url, "-severity", "low,medium,high,critical", "-rate-limit", rateLimit, "-jsonl", "-o", "/outputs/nuclei-" + safeHost + ".jsonl"]
    case "ffuf":
      return ["ffuf", "-u", ensureFfufUrl(url), "-w", req.wordlist ?? "/usr/share/wordlists/dirb/common.txt", "-rate", rateLimit, "-of", "json", "-o", "/outputs/ffuf-" + safeHost + ".json"]
    case "gobuster":
      return ["gobuster", "dir", "-u", url, "-w", req.wordlist ?? "/usr/share/wordlists/dirb/common.txt", "--no-error", "-o", "/outputs/gobuster-" + safeHost + ".txt"]
    case "sqlmap":
      return ["sqlmap", "-u", url, "--batch", "--smart", "--level", "1", "--risk", "1", "--output-dir", "/outputs/sqlmap"]
  }
}

export function buildSecurityDockerArgs(params: {
  image: string
  command: string[]
  workdir: string
  outputDir: string
  network: SecuritySandboxConfig["network"]
}): string[] {
  const networkArgs = params.network === "none"
    ? ["--network", "none"]
    : params.network === "host"
      ? ["--network", "host"]
      : []

  return [
    "run", "--rm",
    "--cap-drop", "ALL",
    "--security-opt", "no-new-privileges",
    "--memory", "768m",
    "--cpus", "1.5",
    "--pids-limit", "256",
    "--read-only",
    "--tmpfs", "/tmp:rw,noexec,nosuid,size=128m",
    ...networkArgs,
    "-v", `${params.workdir}:/workspace:ro`,
    "-v", `${params.outputDir}:/outputs:rw`,
    "-w", "/workspace",
    params.image,
    ...params.command,
  ]
}

export async function runSecurityDockerTool(req: SecurityDockerRunRequest): Promise<SecurityDockerRunResult> {
  const target = parseSecurityTarget(req.target)
  assertTargetAllowed(target, req.config)
  return securityPolicyManager.run({
    action: req.action,
    target,
    config: req.config,
    workdir: req.workdir,
    fn: async () => {
      const security = resolveSecuritySandboxConfig(req.config)
      const image = security.image
      const outputDir = join(req.workdir, ".aurict", "security", "runs", `${Date.now()}-${safeName(target.host)}-${req.action}`)
      await mkdir(outputDir, { recursive: true })

      const command = buildSecurityDockerCommand(req.action, target, {
        ...req,
        extra: {
          ...(req.extra ?? {}),
          rateLimit: getSecurityActionRequestBudget(req.action, security),
        },
      })
      const dockerArgs = buildSecurityDockerArgs({
        image,
        command,
        workdir: req.workdir,
        outputDir,
        network: security.network,
      })

      const timeoutMs = getSecurityActionTimeoutMs(req.action)
      const proc = spawn(["docker", ...dockerArgs], {
        cwd: req.workdir,
        stdout: "pipe",
        stderr: "pipe",
      })
      let timedOut = false
      const kill = () => {
        timedOut = true
        try { proc.kill() } catch {}
      }
      const timer = setTimeout(kill, timeoutMs)
      const onAbort = () => kill()
      if (req.signal.aborted) kill()
      else req.signal.addEventListener("abort", onAbort, { once: true })

      try {
        const [stdout, stderr, exitCode] = await Promise.all([
          new Response(proc.stdout).text(),
          new Response(proc.stderr).text(),
          proc.exited,
        ])
        return {
          action: req.action,
          target,
          image,
          command,
          outputDir,
          stdout: limit(stdout),
          stderr: limit(stderr),
          exitCode: exitCode ?? -1,
          timedOut,
        }
      } finally {
        clearTimeout(timer)
        req.signal.removeEventListener("abort", onAbort)
      }
    },
  })
}

function safeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_.-]+/g, "_").slice(0, 80) || "target"
}

function limit(value: string): string {
  return value.length > OUTPUT_MAX_CHARS ? `${value.slice(0, OUTPUT_MAX_CHARS)}\n[truncated]` : value
}

function ensureFfufUrl(url: string): string {
  return url.includes("FUZZ") ? url : `${url.replace(/\/+$/, "")}/FUZZ`
}
