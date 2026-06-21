import { spawn } from "bun"
import type { CommandAnalysis } from "./classifier.js"
import { ptyManager } from "../pty/manager.js"

export type SandboxBackend = "none" | "policy" | "docker"

export interface SandboxConfig {
  image?: string // Varsayılan: node:20-slim
  network?: boolean // Varsayılan: true
  backend?: SandboxBackend
  dockerEnabled?: boolean
}

export interface SandboxDecision {
  backend: SandboxBackend
  reason: string
}

/**
 * Low-overhead default sandbox decision.
 *
 * "policy" is not container isolation. It means the command runs through the guarded
 * execution path: permission checks in executor/bash, scrubbed environment, timeouts,
 * output limits, and audit/diagnostics. Docker remains an optional heavy backend.
 */
export function chooseSandboxBackend(
  command: string,
  analysis: CommandAnalysis,
  config: SandboxConfig = {},
): SandboxDecision {
  const explicit = config.backend ?? sandboxBackendFromEnv()
  if (explicit === "none") return { backend: "none", reason: "sandbox disabled" }

  const riskyRuntime = /\b(node|python|python3|ruby|bash|sh|zsh|fish|bun|npm|npx|yarn|pnpm)\b/.test(command)
  const network      = /\b(curl|wget|ssh|scp|sftp|nc|netcat|telnet)\b/.test(command)
  const mutating     = !analysis.isReadOnly

  if (!mutating && !riskyRuntime && !network) {
    return { backend: "none", reason: "read-only command" }
  }

  const wantsDocker = explicit === "docker" || config.dockerEnabled === true
  if (wantsDocker) {
    return { backend: "docker", reason: "docker backend requested" }
  }

  return {
    backend: "policy",
    reason: analysis.reason || (network ? "network command" : riskyRuntime ? "script/runtime command" : "mutating command"),
  }
}

export function shouldUseSandbox(command: string, analysis: CommandAnalysis): boolean {
  return chooseSandboxBackend(command, analysis).backend !== "none"
}

function sandboxBackendFromEnv(): SandboxBackend | undefined {
  const raw = process.env["AURICT_SANDBOX_BACKEND"] ?? process.env["AURICT_SANDBOX"]
  if (raw === "none" || raw === "policy" || raw === "docker") return raw
  if (raw === "off" || raw === "false" || raw === "0") return "none"
  return undefined
}

function policyEnv(extra?: Record<string, string>): Record<string, string> {
  const allowed = [
    "PATH", "HOME", "USER", "USERNAME", "SHELL", "TERM", "COLORTERM",
    "LANG", "LC_ALL", "TMPDIR", "TEMP", "TMP",
  ]
  const env: Record<string, string> = {}
  for (const key of allowed) {
    const value = process.env[key]
    if (value !== undefined) env[key] = value
  }
  env["AURICT_SANDBOX"] = "policy"
  env["AURICT_SANDBOX_ENV"] = "scrubbed"
  return { ...env, ...(extra ?? {}) }
}

export async function startPolicySandboxedProcess(
  command: string,
  args: string[],
  workdir: string,
  env?: Record<string, string>,
) {
  return ptyManager.create(command, args, workdir, policyEnv(env), { inheritEnv: false })
}

/**
 * Verilen komutu geçici bir Docker container'ı içinde (sandbox) başlatır.
 * PTY Session döndürür.
 */
export async function startDockerSandboxedProcess(
  command: string,
  args: string[],
  workdir: string,
  env?: Record<string, string>,
  config?: SandboxConfig
) {
  const image = config?.image || "node:20-slim"
  const netFlag = config?.network === false ? "--network=none" : ""

  // Environment variable'ları docker -e formatına çevir
  const envArgs: string[] = []
  if (env) {
    for (const [k, v] of Object.entries(env)) {
      envArgs.push("-e", `${k}=${v}`)
    }
  }

  // Docker command: docker run --rm -i -v <workdir>:/workspace -w /workspace <env> <image> <command> <args>
  const dockerArgs = [
    "run", "--rm", "-i",
    "-v", `${workdir}:/workspace`,
    "-w", "/workspace",
    ...envArgs
  ]

  if (netFlag) {
    dockerArgs.push(netFlag)
  }

  dockerArgs.push(image)

  // Asıl komut ve argümanlar
  dockerArgs.push(command, ...args)

  // Bunu normal ptyManager üzerinden Docker çalıştıracak şekilde sarmalıyoruz
  return ptyManager.create("docker", dockerArgs, workdir, {})
}

export const startSandboxedProcess = startDockerSandboxedProcess
