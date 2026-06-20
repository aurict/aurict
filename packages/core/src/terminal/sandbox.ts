import { spawn } from "bun"
import type { CommandAnalysis } from "./classifier.js"
import { ptyManager } from "../pty/manager.js"

export interface SandboxConfig {
  image?: string // Varsayılan: node:20-bullseye
  network?: boolean // Varsayılan: true
}

/**
 * Docker sandboxing disabled — requires Docker daemon which is not universally available.
 * Security is handled at the permission layer (user approves each bash command).
 */
export function shouldUseSandbox(_command: string, _analysis: CommandAnalysis): boolean {
  return false
}

/**
 * Verilen komutu geçici bir Docker container'ı içinde (sandbox) başlatır.
 * PTY Session döndürür.
 */
export async function startSandboxedProcess(
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
