import { mkdir, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { spawn } from "node:child_process"

export type EvalRuntime = "bun" | "node" | "python"
export type EvalCwd = "temp" | "workspace"

export interface EvalInput {
  runtime: EvalRuntime
  code: string
  stdin?: string
  timeoutMs: number
  cwd: EvalCwd
}

export interface EvalResult {
  runtime: EvalRuntime
  exitCode: number | null
  signal: string | null
  timedOut: boolean
  durationMs: number
  stdout: string
  stderr: string
  truncated: boolean
}

const MAX_OUTPUT_BYTES = 64 * 1024

export async function runStatelessEval(input: EvalInput, workdir: string, signal: AbortSignal): Promise<EvalResult> {
  const temp = await mkdtemp(join(tmpdir(), "aurict-eval-"))
  const cwd = input.cwd === "workspace" ? resolve(workdir) : temp
  await mkdir(cwd, { recursive: true })
  const started = Date.now()
  const { command, args } = runtimeCommand(input.runtime, input.code)
  let timedOut = false
  try {
    return await new Promise<EvalResult>((resolveResult, reject) => {
      const child = spawn(command, args, {
        cwd,
        env: scrubbedEnvironment(),
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
      })
      const stdout: Buffer[] = []
      const stderr: Buffer[] = []
      let outputBytes = 0
      let truncated = false
      const capture = (bucket: Buffer[]) => (chunk: Buffer) => {
        if (outputBytes >= MAX_OUTPUT_BYTES) { truncated = true; return }
        const remaining = MAX_OUTPUT_BYTES - outputBytes
        const accepted = chunk.subarray(0, remaining)
        bucket.push(accepted)
        outputBytes += accepted.length
        if (accepted.length < chunk.length) truncated = true
      }
      child.stdout.on("data", capture(stdout))
      child.stderr.on("data", capture(stderr))
      child.on("error", reject)
      const stop = () => child.kill("SIGKILL")
      const onAbort = () => stop()
      signal.addEventListener("abort", onAbort, { once: true })
      const timer = setTimeout(() => { timedOut = true; stop() }, input.timeoutMs)
      child.on("close", (exitCode, exitSignal) => {
        clearTimeout(timer)
        signal.removeEventListener("abort", onAbort)
        resolveResult({
          runtime: input.runtime,
          exitCode,
          signal: exitSignal,
          timedOut,
          durationMs: Date.now() - started,
          stdout: Buffer.concat(stdout).toString("utf8"),
          stderr: Buffer.concat(stderr).toString("utf8"),
          truncated,
        })
      })
      child.stdin.end(input.stdin ?? "")
    })
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
}

function runtimeCommand(runtime: EvalRuntime, code: string): { command: string; args: string[] } {
  switch (runtime) {
    case "bun": return { command: "bun", args: ["--smol", "-e", code] }
    case "node": return { command: "node", args: ["--max-old-space-size=128", "-e", code] }
    case "python": return { command: "python3", args: ["-I", "-c", code] }
  }
}

function scrubbedEnvironment(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {}
  for (const key of ["PATH", "LANG", "LC_ALL", "TZ", "SYSTEMROOT", "WINDIR"]) {
    if (process.env[key] !== undefined) env[key] = process.env[key]
  }
  env["NO_COLOR"] = "1"
  return env
}
