import { access, mkdir, unlink, writeFile } from "node:fs/promises"
import { constants } from "node:fs"
import { homedir, platform, arch } from "node:os"
import { join } from "node:path"
import { createRequire } from "node:module"
import { spawnSync } from "node:child_process"
import { loadConfig, resolveSecuritySandboxConfig, detectKeystore } from "@aurict/core"
import { CURRENT_VERSION } from "./update-check.js"

type Status = "ok" | "warn" | "fail"

interface Check {
  status: Status
  label: string
  detail: string
}

/**
 * JSON schema — output of `aurict doctor --json`.
 *
 * Changing this interface requires a major version bump; external tools
 * (CI automation, dashboards) may depend on these field names.
 * Adding new fields is fine; do not rename existing field names.
 */
export interface DoctorReport {
  schema:    "aurict.doctor/v1"
  version:   string
  workdir:   string
  timestamp: string
  summary:   { ok: number; warn: number; fail: number; total: number }
  checks:    Check[]
  exitCode:  number
}

const require = createRequire(import.meta.url)

const ARCH_MAP: Record<string, string> = {
  x64: "x64",
  arm64: "arm64",
  aarch64: "arm64",
}

function line(check: Check): string {
  const marker = check.status === "ok" ? "ok" : check.status === "warn" ? "warn" : "fail"
  return `[${marker}] ${check.label}: ${check.detail}`
}

async function canWriteAurictHome(): Promise<Check> {
  const dir = join(homedir(), ".aurict")
  const probe = join(dir, `.doctor-${process.pid}`)
  try {
    await mkdir(dir, { recursive: true })
    await writeFile(probe, "ok", "utf8")
    await unlink(probe)
    return { status: "ok", label: "home", detail: `${dir} is writable` }
  } catch (err) {
    return { status: "fail", label: "home", detail: `cannot write ${dir}: ${err instanceof Error ? err.message : String(err)}` }
  }
}

async function canReadConfig(): Promise<Check> {
  const config = join(homedir(), ".aurict", "config.json")
  try {
    await access(config, constants.R_OK)
    return { status: "ok", label: "config", detail: `${config} is readable` }
  } catch {
    return { status: "warn", label: "config", detail: `${config} not found; first-run setup will create it` }
  }
}

function providerEnv(): Check {
  const vars = [
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "OPENROUTER_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "OPENCODE_API_KEY",
    "XAI_API_KEY",
    "AZURE_OPENAI_API_KEY",
    "AWS_ACCESS_KEY_ID",
  ]
  const configured = vars.filter((name) => Boolean(process.env[name]))
  if (configured.length > 0) {
    return { status: "ok", label: "providers", detail: `${configured.length} provider env var(s) detected` }
  }
  return { status: "warn", label: "providers", detail: "no provider env vars detected; Ollama may still work locally" }
}

function platformPackage(): Check {
  const currentPlatform = platform()
  const currentArch = arch()
  const mappedArch = ARCH_MAP[currentArch]
  const supported = currentPlatform === "linux" || currentPlatform === "darwin" || currentPlatform === "win32"

  if (!mappedArch || !supported) {
    return {
      status: "fail",
      label: "platform",
      detail: `${currentPlatform}/${currentArch} is unsupported`,
    }
  }

  const pkg = `@aurict/cli-${currentPlatform}-${mappedArch}`
  try {
    const pkgJson = require.resolve(`${pkg}/package.json`)
    return { status: "ok", label: "platform", detail: `${pkg} resolved at ${pkgJson}` }
  } catch {
    return {
      status: "warn",
      label: "platform",
      detail: `${pkg} is not resolvable from this checkout; packaged installs should include it as an optional dependency`,
    }
  }
}

function bunRuntime(): Check {
  return { status: "ok", label: "runtime", detail: `Bun ${Bun.version}` }
}

function serverPort(port = 7777): Check {
  try {
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port,
      fetch: () => new Response("ok"),
    })
    server.stop(true)
    return { status: "ok", label: "server", detail: `127.0.0.1:${port} is available` }
  } catch (err) {
    const code = err && typeof err === "object" ? (err as { code?: unknown }).code : undefined
    if (code === "EADDRINUSE") {
      return { status: "warn", label: "server", detail: `127.0.0.1:${port} is already in use; Aurict will reuse/continue without starting another local API server` }
    }
    return { status: "fail", label: "server", detail: `port check failed: ${err instanceof Error ? err.message : String(err)}` }
  }
}

function sandboxMode(): Check {
  const raw = process.env["AURICT_SANDBOX_BACKEND"] ?? process.env["AURICT_SANDBOX"] ?? "policy"
  const mode = raw === "off" || raw === "false" || raw === "0" ? "none" : raw
  if (mode === "docker") {
    return {
      status: "warn",
      label: "sandbox",
      detail: "docker backend requested; stronger process isolation but higher startup/resource cost",
    }
  }
  if (mode === "none") {
    return {
      status: "warn",
      label: "sandbox",
      detail: "disabled; shell commands rely only on permission prompts and tool timeouts",
    }
  }
  if (mode !== "policy") {
    return {
      status: "warn",
      label: "sandbox",
      detail: `unknown mode '${mode}', default runtime behavior is policy guarded execution`,
    }
  }
  return {
    status: "ok",
    label: "sandbox",
    detail: "policy guarded execution active; this is not container/process isolation",
  }
}

function securitySandbox(workdir: string): Check {
  const cfg = loadConfig(workdir)
  const security = resolveSecuritySandboxConfig(cfg)
  if (security.enabled !== true || security.profile === "off") {
    return {
      status: "ok",
      label: "security",
      detail: "security capability disabled; active security tools are hidden from model context",
    }
  }

  const allowlist = security.targetAllowlist
  if ((security.profile === "active-lite" || security.profile === "kali-full") && allowlist.length === 0) {
    return {
      status: "warn",
      label: "security",
      detail: `${security.profile} enabled but targetAllowlist is empty; security_recon/security_scan will refuse external targets`,
    }
  }

  return {
    status: "ok",
    label: "security",
    detail: `${security.profile} enabled with ${allowlist.length} allowlisted target(s), image=${security.image || "(none)"}, network=${security.network}, limits=${security.maxConcurrent} concurrent/${security.requestsPerMinute}rpm`,
  }
}

function dockerSecurityImage(workdir: string): Check | null {
  const cfg = loadConfig(workdir)
  const security = resolveSecuritySandboxConfig(cfg)
  if (security.enabled !== true || security.profile === "off" || security.profile === "passive") return null

  const image = security.image
  const version = spawnSync("docker", ["--version"], { encoding: "utf8" })
  if (version.error || version.status !== 0) {
    return {
      status: "warn",
      label: "security-image",
      detail: `Docker CLI not available; container-backed security scan types will fail until Docker is installed`,
    }
  }

  const inspect = spawnSync("docker", ["image", "inspect", image], { encoding: "utf8" })
  if (inspect.status !== 0) {
    const dockerfile = security.profile === "kali-full" ? "docker/security-kali-full" : "docker/security-lite"
    const installHint = image.startsWith("ghcr.io/")
      ? `pull with: docker pull ${image}`
      : `build with: docker build -t ${image} ${dockerfile}`
    return {
      status: "warn",
      label: "security-image",
      detail: `${image} not found locally; ${installHint}. Local build alternative: docker build -t ${image} ${dockerfile}`,
    }
  }

  return {
    status: "ok",
    label: "security-image",
    detail: `${image} is available locally`,
  }
}

async function keystoreCapability(): Promise<Check> {
  let cap
  try {
    cap = await detectKeystore()
  } catch (err) {
    cap = {
      backend:   "none" as const,
      label:     "no keystore",
      available: false,
      reason:    err instanceof Error ? err.message : String(err),
    }
  }

  if (cap.backend === "macos-keychain" || cap.backend === "windows-credential" || cap.backend === "linux-secret-service") {
    return {
      status: cap.available ? "ok" : "warn",
      label:  "keystore",
      detail: cap.available
        ? `${cap.label} active (native) for API key storage`
        : `${cap.label} unavailable: ${cap.reason ?? "unknown"} — falling back to plain file`,
    }
  }
  if (cap.backend === "plain-file") {
    return {
      status: cap.available ? "warn" : "fail",
      label:  "keystore",
      detail: cap.available
        ? `native OS keystore unavailable; plain file fallback (${cap.label.split(/\(|\)/)[1] ?? ""})`
        : `no keystore available: ${cap.reason ?? "unknown"}`,
    }
  }
  return {
    status: "fail",
    label:  "keystore",
    detail: `no keystore available: ${cap.reason ?? "unknown"}`,
  }
}

/** Core check generator — both the text and JSON formatters depend on this. */
async function collectChecks(workdir: string): Promise<Check[]> {
  const securityImageCheck = dockerSecurityImage(workdir)
  return [
    bunRuntime(),
    platformPackage(),
    await canWriteAurictHome(),
    await canReadConfig(),
    providerEnv(),
    serverPort(),
    sandboxMode(),
    securitySandbox(workdir),
    ...(securityImageCheck ? [securityImageCheck] : []),
    await keystoreCapability(),
  ]
}

function summarize(checks: Check[]): { ok: number; warn: number; fail: number; total: number } {
  const ok = checks.filter((c) => c.status === "ok").length
  const warn = checks.filter((c) => c.status === "warn").length
  const fail = checks.filter((c) => c.status === "fail").length
  return { ok, warn, fail, total: checks.length }
}

export interface DoctorOptions {
  /** JSON output mode — for `aurict doctor --json` and automation tools. */
  json?: boolean
}

/** Human-readable text report — used by the `/doctor` slash command. */
export async function getDoctorReport(workdir: string): Promise<{ text: string; exitCode: number }> {
  const checks = await collectChecks(workdir)
  const summary = summarize(checks)
  const output: string[] = []

  output.push("Aurict doctor")
  output.push(`workdir: ${workdir}`)
  output.push("")
  for (const check of checks) output.push(line(check))
  output.push("")
  output.push(`${summary.ok} ok, ${summary.warn} warning(s), ${summary.fail} failure(s)`)

  // Human output prints home paths as ~/…; the JSON report keeps them exact.
  const home = process.env["HOME"]
  const text = output.join("\n")
  return {
    text: home ? text.replaceAll(`${home}/`, "~/") : text,
    exitCode: summary.fail > 0 ? 1 : 0,
  }
}

/** JSON report — for `aurict doctor --json` and CI/CD tools. Fixed schema (`DoctorReport`). */
export async function getDoctorReportJson(workdir: string): Promise<{ json: string; exitCode: number }> {
  const checks = await collectChecks(workdir)
  const summary = summarize(checks)
  const report: DoctorReport = {
    schema:    "aurict.doctor/v1",
    version:   CURRENT_VERSION,
    workdir,
    timestamp: new Date().toISOString(),
    summary,
    checks,
    exitCode: summary.fail > 0 ? 1 : 0,
  }
  return {
    json: JSON.stringify(report, null, 2),
    exitCode: report.exitCode,
  }
}
